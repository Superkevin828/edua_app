const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');
const Course = require('../models/Course');

// Upload course thumbnail as Base64
router.post('/course-thumbnail/:courseId', protect, adminAuth, async (req, res) => {
    try {
        const { base64Image, contentType } = req.body;
        
        if (!base64Image) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }
        
        const course = await Course.findByIdAndUpdate(
            req.params.courseId,
            {
                thumbnail: {
                    data: base64Image,
                    contentType: contentType || 'image/png'
                }
            },
            { new: true }
        );
        
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        
        res.json({ success: true, message: 'Thumbnail uploaded!', course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// Serve Base64 image directly ok
router.get('/image/:courseId', async (req, res) => {
    try {
        
        const course = await Course.findById(req.params.courseId).select('thumbnail');
        
        if (!course || !course.thumbnail || !course.thumbnail.data) {
            // Return default image
            return res.redirect('/images/default-course.jpg');
        }
        
        // Convert Base64 to buffer
        const imgBuffer = Buffer.from(course.thumbnail.data, 'base64');
        
        // Set content type and send image
        res.writeHead(200, {
            'Content-Type': course.thumbnail.contentType || 'image/png',
            'Content-Length': imgBuffer.length
        });
        res.end(imgBuffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;