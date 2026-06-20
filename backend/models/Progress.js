const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    completedLessons: [{
        lesson: {
            type: Number,
            required: true,
        },
        completedAt: {
            type: Date,
            default: Date.now
        },
        timeSpent: {
            type: Number,
            default: 0
        }
    }],
    quizScores: [{
        lesson: {
            type: Number,
            required: true  
        },
        score: Number,
        totalQuestions: Number,
        completedAt: Date
    }],
    overallProgress: {
        type: Number,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    certificateIssued: {
        type: Boolean,
        default: false
    },
    certificateUrl: String,
    lastAccessed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Progress', progressSchema);
