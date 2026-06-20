const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    updateLessonProgress,
    getCourseProgress,
    submitQuiz
} = require('../controllers/progressController');

router.post('/lesson/:lessonId', protect, updateLessonProgress);
router.get('/course/:courseId', protect, getCourseProgress);
router.post('/quiz/:lessonId', protect, submitQuiz);

module.exports = router;