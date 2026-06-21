const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    lessonId: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        default: ''
    },
    videoUrl: {
        type: String,
        default: ''
    },
    duration: {
        type: String,
        default: '15 min'
    },
    type: {
        type: String,
        enum: ['video', 'article', 'quiz', 'project', 'workshop', 'lab', 'review'],
        default: 'article'
    },
    isFree: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        required: true
    },
    // Module grouping — used by Python v9 curriculum
    module: {
        type: String,
        default: ''
    }
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a course title'],
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: {
        type: String,
        required: [true, 'Please add a category']
    },
    thumbnail: {
        data: {type: String,
            default:""
        },
        contentType: {type: String}
    },
    duration: {
        type: String,
        required: [true, 'Please add estimated duration']
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    price: {
        type: Number,
        default: 0
    },
    lessons: [lessonSchema],  // Direct array of lessons - NO MODULES
    instructor: {
        type: String,
        default: 'Expert Instructor'
    },
    rating: {
        type: Number,
        default: 0
    },
    totalStudents: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    tags: [String],
    requirements: [String],
    objectives: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);