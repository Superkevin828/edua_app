const Subscription = require('../models/Subscription');
const User = require('../models/User');

exports.getSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ isActive: true });
        res.status(200).json({ success: true, subscriptions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.upgradeSubscription = async (req, res) => {
    try {
        const { type, billingPeriod } = req.body;
        const subscription = await Subscription.findOne({ type });
        
        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription plan not found' });
        }
        
        const user = await User.findById(req.user.id);
        user.subscription = type;
        
        const now = new Date();
        if (billingPeriod === 'monthly') {
            user.subscriptionExpiry = new Date(now.setMonth(now.getMonth() + 1));
        } else {
            user.subscriptionExpiry = new Date(now.setFullYear(now.getFullYear() + 1));
        }
        
        await user.save();
        res.status(200).json({ success: true, subscription: type, expiry: user.subscriptionExpiry });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.create(req.body);
        res.status(201).json({ success: true, subscription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};