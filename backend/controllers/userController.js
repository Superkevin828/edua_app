const User = require('../models/User');
const Progress = require('../models/Progress');
const Course = require('../models/Course');  // <-- ADD THIS LINE
//const Lesson = require('../models/Lesson');   // <-- ADD THIS LINE TOO

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
    try {
        console.log('Dashboard requested for user:', req.user.id);
        
        // Find user with populated courses
        const user = await User.findById(req.user.id)
            .populate({
                path: 'enrolledCourses.course',
                select: 'title description category duration level rating modules'
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get enrolled courses progress
        const enrolledCourses = [];
        
        if (user.enrolledCourses && user.enrolledCourses.length > 0) {
            for (let enrollment of user.enrolledCourses) {
                if (!enrollment.course) continue;
                
                const progress = await Progress.findOne({
                    user: user._id,
                    course: enrollment.course._id
                });

                let totalLessons = 0;
                if (enrollment.course.modules) {
                    totalLessons = enrollment.course.modules.reduce(
                        (total, module) => total + (module.lessons ? module.lessons.length : 0), 0
                    );
                }

                enrolledCourses.push({
                    _id: enrollment.course._id,
                    title: enrollment.course.title || 'Unknown Course',
                    description: enrollment.course.description || '',
                    category: enrollment.course.category || '',
                    duration: enrollment.course.duration || '',
                    level: enrollment.course.level || 'beginner',
                    rating: enrollment.course.rating || 0,
                    progress: progress ? progress.overallProgress : 0,
                    completedLessons: progress ? progress.completedLessons.length : 0,
                    totalLessons: totalLessons,
                    enrolled: true
                });
            }
        }

        // Get available courses (not enrolled)
        const enrolledCourseIds = user.enrolledCourses
            .filter(e => e.course)
            .map(e => e.course._id || e.course);

        // NOW Course IS DEFINED because we imported it above
        const courses = await Course.find({
            _id: { $nin: enrolledCourseIds },
            isPublished: true
        }).select('title description category duration level rating modules');

        const availableCourses = courses.map(course => {
            let totalLessons = 0;
            if (course.modules) {
                totalLessons = course.modules.reduce(
                    (total, mod) => total + (mod.lessons ? mod.lessons.length : 0), 0
                );
            }
            
            return {
                _id: course._id,
                title: course.title,
                description: course.description || '',
                category: course.category || '',
                duration: course.duration || '',
                level: course.level || 'beginner',
                rating: course.rating || 0,
                totalLessons: totalLessons,
                enrolled: false
            };
        });

        // Calculate stats
        const enrolledCount = user.enrolledCourses ? user.enrolledCourses.length : 0;
        const completedLessons = user.learningProgress ? 
            (user.learningProgress.totalLessonsCompleted || 0) : 0;
        const totalHours = user.learningProgress ? 
            Math.round((user.learningProgress.totalTimeSpent || 0) / 60) : 0;

        // Calculate overall progress
        const overallProgress = enrolledCourses.length > 0
            ? Math.round(enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / enrolledCourses.length)
            : 0;

        res.status(200).json({
            success: true,
            stats: {
                enrolledCourses: enrolledCount,
                completedLessons: completedLessons,
                totalHours: totalHours,
                overallProgress: overallProgress
            },
            enrolledCourses: enrolledCourses,
            availableCourses: availableCourses,
            progress: {
                overall: overallProgress,
                courses: enrolledCourses.map(c => ({
                    title: c.title,
                    completion: c.progress || 0
                }))
            }
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading dashboard',
            error: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, preferences } = req.body;
        const updateFields = {};
        if (fullName) updateFields.fullName = fullName;
        if (email) updateFields.email = email;
        if (preferences) updateFields.preferences = preferences;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateFields,
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort('-createdAt');
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single user (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};