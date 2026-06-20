const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    signup,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    updatePassword,
    verifyEmail,
    logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation rules
const signupValidation = [
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 50 })
        .withMessage('Name cannot exceed 50 characters'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.put('/update-password', protect, updatePassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/logout', protect, logout);

module.exports = router;