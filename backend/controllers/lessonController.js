const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

// Get all lessons (admin)
exports.getAllLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find().sort('-createdAt');
        res.status(200).json({ success: true, lessons });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get lessons for a course
exports.getCourseLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find({ courseId: req.params.courseId }).sort('order');
        res.status(200).json({ success: true, lessons });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single lesson
exports.getLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }
        res.status(200).json({ success: true, lesson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create lesson
exports.createLesson = async (req, res) => {
    try {
        const lesson = await Lesson.create(req.body);
        
        // Add lesson to course module
        if (lesson.courseId && lesson.moduleId) {
            await Course.findOneAndUpdate(
                { '_id': lesson.courseId, 'modules.order': parseInt(lesson.moduleId) },
                { $push: { 'modules.$.lessons': lesson._id } }
            );
        }
        
        res.status(201).json({ success: true, lesson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update lesson
exports.updateLesson = async (req, res) => {
    try {
        let lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }
        
        lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        
        res.status(200).json({ success: true, lesson });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete lesson
exports.deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }
        
        // Remove lesson from course
        await Course.findOneAndUpdate(
            { '_id': lesson.courseId },
            { $pull: { 'modules.$[].lessons': lesson._id } }
        );
        
        await Lesson.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: 'Lesson deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};