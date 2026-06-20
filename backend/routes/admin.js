const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/admin');
const {
    login,
    getStats,
    searchStudents,
    promoteUser
} = require('../controllers/adminController');

router.post('/login', login);
router.get('/stats', adminAuth, getStats);
router.get('/students/search', adminAuth, searchStudents);
router.put('/users/:id/promote', adminAuth, promoteUser);

module.exports = router;