const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');
const {
    getCourses,
    getCourse,
    enrollCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    addLesson
} = require('../controllers/courseController');

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourse);

// Protected routes (logged in users)
router.post('/enroll', protect, enrollCourse);

// Admin routes
router.post('/', protect, adminAuth, createCourse);
router.post('/:id/lessons', protect, adminAuth, addLesson);
router.put('/:id', protect, adminAuth, updateCourse);
router.delete('/:id', protect, adminAuth, deleteCourse);

module.exports = router;