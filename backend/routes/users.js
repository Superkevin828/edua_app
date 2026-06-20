const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');
const {
    getDashboard,
    updateProfile,
    getUsers,
    getUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');

router.get('/dashboard', protect, getDashboard);
router.put('/profile', protect, updateProfile);
router.get('/', protect, adminAuth, getUsers);
router.get('/:id', protect, adminAuth, getUser);
router.put('/:id', protect, adminAuth, updateUser);
router.delete('/:id', protect, adminAuth, deleteUser);

module.exports = router;
