const Payment = require('../models/Payment');
const User = require('../models/User');

exports.createPayment = async (req, res) => {
    try {
        const { amount, paymentMethod, subscriptionType, billingPeriod } = req.body;
        const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
        
        const payment = await Payment.create({ user: req.user.id, amount, paymentMethod, subscriptionType, billingPeriod, transactionId });
        
        await User.findByIdAndUpdate(req.user.id, { paymentStatus: 'completed', subscription: subscriptionType });
        
        res.status(201).json({ success: true, payment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user.id }).sort('-createdAt');
        res.status(200).json({ success: true, payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find().populate('user', 'fullName email').sort('-createdAt');
        res.status(200).json({ success: true, count: payments.length, payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};