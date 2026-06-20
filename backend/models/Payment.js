const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    paymentMethod: {
        // Pesapal returns the actual method used (e.g. "VISA", "MASTERCARD",
        // "MTNMOBILEMONEY", "AIRTELMONEY") once a payment completes, so this is
        // intentionally free-form rather than a fixed enum.
        type: String,
        default: 'pesapal'
    },
    transactionId: {
        // Doubles as the Pesapal merchant reference (the "id" sent in SubmitOrderRequest)
        type: String,
        unique: true
    },
    orderTrackingId: {
        // Pesapal's own tracking id, returned after SubmitOrderRequest — used to
        // reconcile the callback/IPN notifications back to this Payment record
        type: String,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    subscriptionType: {
        type: String,
        enum: ['pro', 'premium'],
        required: true
    },
    billingPeriod: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    receipt: String,
    refundReason: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
