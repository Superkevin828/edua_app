const Admin = require('../models/Admin');
const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email }).select('+password');
        
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        admin.lastLogin = Date.now();
        await admin.save();
        
        const token = admin.getSignedJwtToken();
        
        res.status(200).json({
            success: true, token,
            admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments();
        const activeStudents = await User.countDocuments({ isActive: true });
        const paidStudents = await User.countDocuments({ subscription: { $in: ['pro', 'premium'] } });
        const freeUsers = await User.countDocuments({ subscription: 'free' });
        const proSubscribers = await User.countDocuments({ subscription: 'pro' });
        const premiumSubscribers = await User.countDocuments({ subscription: 'premium' });
        
        const payments = await Payment.find({ status: 'completed' });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const monthlyRevenue = payments.filter(p => {
            const d = new Date(p.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).reduce((sum, p) => sum + p.amount, 0);
        
        const totalCourses = await Course.countDocuments();
        const publishedCourses = await Course.countDocuments({ isPublished: true });
        
        res.status(200).json({
            success: true,
            stats: { totalStudents, activeStudents, paidStudents, freeUsers, proSubscribers, premiumSubscribers, totalRevenue, monthlyRevenue, totalCourses, publishedCourses }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.searchStudents = async (req, res) => {
    try {
        const { query } = req.query;
        const students = await User.find({
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('-password');
        
        res.status(200).json({ success: true, count: students.length, students });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.promoteUser = async (req, res) => {
    try {
        const { subscription } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { subscription, subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};