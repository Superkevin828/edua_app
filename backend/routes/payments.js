const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/auth'); // adjust path if your auth middleware lives elsewhere

// ---------------------------------------------------------
// Pesapal config
// ---------------------------------------------------------
// .env needs:
//   PESAPAL_CONSUMER_KEY
//   PESAPAL_CONSUMER_SECRET
//   PESAPAL_BASE_URL       sandbox: https://cybqa.pesapal.com/pesapalv3 | live: https://pay.pesapal.com/v3
//   PESAPAL_CALLBACK_URL   e.g. https://yourdomain.com/api/payments/pesapal/callback
//   PESAPAL_IPN_URL        e.g. https://yourdomain.com/api/payments/pesapal/ipn
//   PESAPAL_IPN_ID         optional — paste in after first run to skip re-registering
const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL;

let cachedToken = null;
let tokenExpiry = 0;
let cachedIpnId = process.env.PESAPAL_IPN_ID || null;

// Plan price lookup (server-side fallback if Subscription doc isn't found)
const PLAN_PRICES = {

    pro: 10.0,
    premium: 39.0
};

// ---------------------------------------------------------
// Pesapal API helpers
// ---------------------------------------------------------
// Node's native fetch has NO default timeout. If Pesapal is ever slow
// or briefly unresponsive, a plain fetch() just hangs until the OS
// eventually gives up — in production this showed up as one request
// taking 5+ minutes to resolve. Every outbound Pesapal call below goes
// through this wrapper so a slow response fails fast instead of
// hanging the whole request (and the user's "Preparing checkout" screen).
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error(`Pesapal request to ${url} timed out after ${timeoutMs}ms`);
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

async function getPesapalToken() {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

    const started = Date.now();
    const res = await fetchWithTimeout(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
        })
    });
    console.log(`Pesapal RequestToken took ${Date.now() - started}ms`);

    const data = await res.json();
    if (!data.token) throw new Error('Pesapal auth failed: ' + JSON.stringify(data));

    cachedToken = data.token;
    // Pesapal documents the token as valid for a MAXIMUM of 5 minutes.
    // The previous version cached it for 10 — meaning every request in
    // the second half of that window used an already-expired token,
    // which Pesapal rejects with an auth error. Trust the server's own
    // `expiryDate` instead of guessing a duration, refreshing 30s early
    // as a safety margin; fall back to a conservative 4 minutes only if
    // expiryDate is ever missing from the response.
    const serverExpiry = data.expiryDate ? new Date(data.expiryDate).getTime() : NaN;
    tokenExpiry = Number.isFinite(serverExpiry)
        ? serverExpiry - 30 * 1000
        : Date.now() + 4 * 60 * 1000;
    return cachedToken;
}

async function registerIpn() {
    if (cachedIpnId) return cachedIpnId;

    const token = await getPesapalToken();
    const started = Date.now();
    const res = await fetchWithTimeout(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: process.env.PESAPAL_IPN_URL, ipn_notification_type: 'GET' })
    });
    console.log(`Pesapal RegisterIPN took ${Date.now() - started}ms`);

    const data = await res.json();
    if (!data.ipn_id) throw new Error('Pesapal IPN registration failed: ' + JSON.stringify(data));

    cachedIpnId = data.ipn_id;
    console.log('Registered Pesapal IPN id:', cachedIpnId, '— save as PESAPAL_IPN_ID in .env to skip re-registering');
    return cachedIpnId;
}

async function checkPesapalStatus(orderTrackingId) {
    const token = await getPesapalToken();
    const started = Date.now();
    const res = await fetchWithTimeout(
        `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }
    );
    console.log(`Pesapal GetTransactionStatus took ${Date.now() - started}ms`);
    const data = await res.json();
    console.log('--- Pesapal GetTransactionStatus raw response ---');
    console.log(JSON.stringify(data, null, 2));
    console.log('--------------------------------------------------');
    return data;
}

function mapStatus(description) {
    switch ((description || '').toUpperCase()) {
        case 'COMPLETED': return 'completed';
        case 'FAILED': return 'failed';
        case 'INVALID': return 'failed';
        case 'REVERSED': return 'refunded';
        default: return 'pending';
    }
}

async function activateSubscription(payment) {
    const expiry = new Date();
    if (payment.billingPeriod === 'monthly') {
        expiry.setMonth(expiry.getMonth() + 1);
    } else {
        expiry.setFullYear(expiry.getFullYear() + 1);
    }

    await User.findByIdAndUpdate(payment.user, {
        subscription: payment.subscriptionType,
        subscriptionExpiry: expiry,
        paymentStatus: 'completed'
    });
}

// Shared reconciliation logic used by both the browser callback and the IPN
async function reconcile(orderTrackingId) {
    const statusData = await checkPesapalStatus(orderTrackingId);
    const status = mapStatus(statusData.payment_status_description);

    const payment = await Payment.findOne({ orderTrackingId });
    if (!payment) throw new Error('No matching payment for orderTrackingId ' + orderTrackingId);

    // Idempotent — once marked completed, later duplicate notifications are no-ops
    if (payment.status !== 'completed') {
        payment.status = status;
        payment.paymentMethod = (statusData.payment_method || payment.paymentMethod || '').toString();
        payment.receipt = statusData.confirmation_code || payment.receipt;
        await payment.save();

        if (status === 'completed') {
            await activateSubscription(payment);
        }
    }

    return payment;
}

// ---------------------------------------------------------
// POST /api/payments/pesapal/create-order
// ---------------------------------------------------------
router.post('/pesapal/create-order', protect, async (req, res) => {
    try {
        const { plan, billingPeriod } = req.body;
        const planKey = (plan || '').toLowerCase();
        if (planKey === 'free') {
            return res.status(400).json({ success: false, message: 'Free plan does not require payment' });
        }


        if (!PLAN_PRICES[planKey]) {
            return res.status(400).json({ success: false, message: 'Invalid plan' });
        }


        if (!['monthly', 'yearly'].includes(billingPeriod)) {
            return res.status(400).json({ success: false, message: 'Invalid billing period' });
        }

        const subPlan = await Subscription.findOne({ type: planKey, isActive: true });
        const subPlanAmount = subPlan ? Number(subPlan.price[billingPeriod]) : NaN;
        // PLAN_PRICES only ever held monthly numbers. It's only safe to use
        // as a fallback for monthly billing — falling back to it for yearly
        // would silently charge a customer the monthly price for a year-long
        // subscription if the Subscription doc has price.monthly set but
        // price.yearly left at 0. Better to fail loudly (the existing "not
        // priced correctly" response below) than guess and undercharge.
        let amount;
        if (Number.isFinite(subPlanAmount) && subPlanAmount > 0) {
            amount = subPlanAmount;
        } else if (billingPeriod === 'monthly') {
            amount = PLAN_PRICES[planKey];
        } else {
            amount = 0;
        }

        if (!amount || amount <= 0) {
            console.error(`No valid price configured for plan "${planKey}" (${billingPeriod}). Subscription doc:`, subPlan);
            return res.status(500).json({
                success: false,
                message: 'This plan is not priced correctly yet. Please contact support.'
            });
        }

        const merchantReference = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);

        // Create a pending Payment record up front so the callback/IPN has something to reconcile against
        const payment = await Payment.create({
            user: req.user.id,
            amount,
            currency: 'USD',
            transactionId: merchantReference,
            status: 'pending',
            subscriptionType: planKey,
            billingPeriod
        });

        const token = await getPesapalToken();
        const notification_id = await registerIpn();

        const [firstName, ...rest] = (req.user.fullName || 'Customer').split(' ');

        const submitStarted = Date.now();
        const orderRes = await fetchWithTimeout(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                id: merchantReference,
                currency: 'USD',
                amount,
                description: `${planKey} plan (${billingPeriod})`,
                callback_url: process.env.PESAPAL_CALLBACK_URL,
                notification_id,
                billing_address: {
                    email_address: req.user.email,
                    phone_number: req.user.phone || '',
                    first_name: firstName,
                    last_name: rest.join(' ') || '-',
                    country_code: 'UG'
                }
            })
        });

        const orderData = await orderRes.json();
        console.log('--- Pesapal SubmitOrderRequest ---');
        console.log(`Pesapal SubmitOrderRequest took ${Date.now() - submitStarted}ms`);
        console.log('callback_url used:', process.env.PESAPAL_CALLBACK_URL);
        console.log('notification_id used:', notification_id);
        console.log('response:', JSON.stringify(orderData, null, 2));
        console.log('-----------------------------------');

        if (!orderData.redirect_url) {
            payment.status = 'failed';
            await payment.save();
            return res.status(400).json({ success: false, message: 'Failed to create Pesapal order', details: orderData });
        }

        payment.orderTrackingId = orderData.order_tracking_id;
        await payment.save();

        res.json({ success: true, redirect_url: orderData.redirect_url });
    } catch (err) {
        console.error('Pesapal create-order error:', err);
        res.status(500).json({ success: false, message: 'Failed to start payment' });
    }
});

// ---------------------------------------------------------
// GET /api/payments/pesapal/ipn — server-to-server notification (source of truth)
// ---------------------------------------------------------
router.get('/pesapal/ipn', async (req, res) => {
    try {
        const { OrderTrackingId, OrderMerchantReference } = req.query;
        await reconcile(OrderTrackingId);
        res.json({
            orderNotificationType: 'IPNCHANGE',
            orderTrackingId: OrderTrackingId,
            orderMerchantReference: OrderMerchantReference,
            status: 200
        });
    } catch (err) {
        console.error('Pesapal IPN error:', err);
        res.status(500).json({ status: 500 });
    }
});

// ---------------------------------------------------------
// GET /api/payments/pesapal/confirm/:orderTrackingId
// Called by payment-success.html right after the user lands back from
// Pesapal. Re-checks the REAL status via Pesapal's API (never trust the
// fact that the user simply arrived on this page — Pesapal redirects here
// on failed/cancelled payments too, not just successful ones).
// ---------------------------------------------------------
router.get('/pesapal/confirm/:orderTrackingId', protect, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            orderTrackingId: req.params.orderTrackingId,
            user: req.user.id
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        const updated = await reconcile(req.params.orderTrackingId);

        // Pull the fresh user record so the frontend can refresh its
        // cached subscription info (localStorage) instead of leaving the
        // user permanently stuck on the stale plan from their last login.
        const freshUser = await User.findById(req.user.id).select(
            'fullName email subscription subscriptionExpiry isAdmin role'
        );

        res.json({
            success: true,
            status: updated.status,
            transaction: {
                id: updated.transactionId,
                plan: updated.subscriptionType,
                amount: updated.amount,
                currency: updated.currency
            },
            user: freshUser
        });
    } catch (err) {
        console.error('Pesapal confirm error:', err);
        res.status(500).json({ success: false, message: 'Failed to confirm payment' });
    }
});

// ---------------------------------------------------------
// GET /api/payments/pesapal/status/:orderTrackingId — optional frontend polling
// ---------------------------------------------------------
router.get('/pesapal/status/:orderTrackingId', protect, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            orderTrackingId: req.params.orderTrackingId,
            user: req.user.id
        });
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
        res.json({ success: true, status: payment.status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ---------------------------------------------------------
// Warm-up: pre-fetch the Pesapal auth token and IPN id once at server
// startup, rather than lazily on a real user's first checkout request.
// This matters most after a cold start (e.g. Render free tier waking up
// from sleep) — without this, a user's first payment attempt has to wait
// through the cold start AND the token + IPN registration calls, all in
// the same request, which is what made checkout feel like it "hangs".
// ---------------------------------------------------------
async function warmUpPesapal() {
    try {
        await getPesapalToken();
        await registerIpn();
        console.log('Pesapal warm-up complete — token and IPN id cached');
    } catch (err) {
        // Don't crash the server over this — checkout will just fall back
        // to fetching them lazily on the first real request, same as before.
        console.error('Pesapal warm-up failed (will retry lazily on first checkout):', err.message);
    }
}

module.exports = router;
module.exports.warmUpPesapal = warmUpPesapal;