const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
    {
        filename: {
            type: String,
            required: true,
            trim: true
        },
        originalName: {
            type: String,
            required: true
        },
        mimetype: {
            type: String,
            required: true
        },
        fileData: {
            type: String, // Base64 encoded file data
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            default: null
        },
        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            default: null
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        category: {
            type: String,
            enum: ['practice', 'resource', 'assignment', 'other'],
            default: 'other'
        },
        description: {
            type: String,
            default: ''
        },
        downloadCount: {
            type: Number,
            default: 0
        },
        isPublic: {
            type: Boolean,
            default: true
        },
        expiresAt: {
            type: Date,
            default: null // null means never expires
        }
    },
    { timestamps: true }
);

// Index for faster queries
uploadSchema.index({ category: 1, createdAt: -1 });
uploadSchema.index({ course: 1 });
uploadSchema.index({ lesson: 1 });
uploadSchema.index({ uploadedBy: 1 });

// Middleware to check expiration before returning
uploadSchema.methods.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

// Increment download count
uploadSchema.methods.incrementDownloadCount = async function() {
    this.downloadCount += 1;
    await this.save();
};

// Get file size in MB
uploadSchema.methods.getFileSizeInMB = function() {
    return (this.fileSize / (1024 * 1024)).toFixed(2);
};

module.exports = mongoose.model('Upload', uploadSchema);
