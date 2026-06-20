const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Get lessons for a course
router.get('/course/:courseId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId).select('lessons');
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        res.status(200).json({ success: true, lessons: course.lessons || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
