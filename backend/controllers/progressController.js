const Progress = require('../models/Progress');
const User = require('../models/User');
const Course = require('../models/Course');

exports.updateLessonProgress = async (req, res) => {
    try {
        const { courseId } = req.body;
        const lessonId = parseInt(req.params.lessonId);
        
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        
        let progress = await Progress.findOne({ user: req.user.id, course: courseId });
        if (!progress) {
            progress = await Progress.create({ user: req.user.id, course: courseId });
        }
        
        const alreadyCompleted = progress.completedLessons.find(l => l.lesson == lessonId);
        
        if (!alreadyCompleted) {
            progress.completedLessons.push({ lesson: lessonId, completedAt: new Date() });
            await User.findByIdAndUpdate(req.user.id, { $inc: { 'learningProgress.totalLessonsCompleted': 1 } });
        }
        
        const totalLessons = course.lessons ? course.lessons.length : 1;
        progress.overallProgress = Math.round((progress.completedLessons.length / totalLessons) * 100);
        progress.lastAccessed = Date.now();
        
        if (progress.overallProgress >= 100) {
            progress.isCompleted = true;
        }
        
        await progress.save();
        
        await User.findOneAndUpdate(
            { '_id': req.user.id, 'enrolledCourses.course': courseId },
            { $set: { 'enrolledCourses.$.progress': progress.overallProgress, 'enrolledCourses.$.completed': progress.isCompleted } }
        );
        
        res.status(200).json({ success: true, progress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getCourseProgress = async (req, res) => {
    try {
        const progress = await Progress.findOne({ user: req.user.id, course: req.params.courseId });
        
        if (!progress) {
            return res.status(200).json({ success: true, progress: { overallProgress: 0, completedLessons: [], isCompleted: false } });
        }
        
        res.status(200).json({ success: true, progress });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.submitQuiz = async (req, res) => {
    try {
        const { courseId, score, totalQuestions } = req.body;
        const progress = await Progress.findOne({ user: req.user.id, course: courseId });
        
        if (progress) {
            progress.quizScores.push({ lesson: parseInt(req.params.lessonId), score, totalQuestions, completedAt: Date.now() });
            await progress.save();
        }
        
        res.status(200).json({ success: true, progress });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};