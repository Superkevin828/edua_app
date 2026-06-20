const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');
const {
    getSubscriptions,
    upgradeSubscription,
    createSubscription
} = require('../controllers/subscriptionController');

router.get('/', getSubscriptions);
router.post('/upgrade', protect, upgradeSubscription);
router.post('/', protect, adminAuth, createSubscription);

module.exports = router;