const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

exports.signup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { fullName, email, password,realpassword } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const user = await User.create({ fullName, email, password,realpassword });
        const token = generateToken(user._id);
        res.status(201).json({
            success: true, token,
            user: { id: user._id, fullName: user.fullName, email: user.email, subscription: user.subscription }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// In your login function, add this check
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        user.lastLogin = Date.now();
        await user.save();

        const token = generateToken(user._id);

        // CHECK IF USER HAS ADMIN ROLE
        const isAdmin = user.role === 'admin' || user.role === 'superadmin';

        res.status(200).json({
            success: true,
            token,
            isAdmin: isAdmin,
            redirectUrl: isAdmin ? '/views/admin/dashboard.html' : '/views/dashboard.html',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                subscription: user.subscription,
                role: user.role || 'user',
                isAdmin: isAdmin,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('enrolledCourses.course');
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No user found with that email' });
        }
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, message: 'Password reset token sent', resetToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
        const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        const token = generateToken(user._id);
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        user.password = newPassword;
        await user.save();
        const token = generateToken(user._id);
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid verification token' });
        }
        user.emailVerified = true;
        user.verificationToken = undefined;
        await user.save();
        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};