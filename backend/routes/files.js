const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Upload = require('../models/Upload');
const { protect } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory before converting to base64

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // You can add file type restrictions here
        cb(null, true);
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/files/upload - Upload file to database
// ═══════════════════════════════════════════════════════════════════════════
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        // Convert file buffer to base64
        const fileData = req.file.buffer.toString('base64');

        // Get file category from query or body
        const { category = 'other', description = '', courseId = null, lessonId = null, expiresAt = null } = req.body;

        // Create upload document
        const uploadDocument = new Upload({
            filename: req.file.originalname,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            fileData: fileData,
            fileSize: req.file.size,
            category: category,
            description: description,
            uploadedBy: req.user.id,
            course: courseId || null,
            lesson: lessonId || null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            isPublic: true
        });

        await uploadDocument.save();

        res.json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                id: uploadDocument._id,
                filename: uploadDocument.originalName,
                size: uploadDocument.getFileSizeInMB(),
                mimetype: uploadDocument.mimetype,
                category: uploadDocument.category,
                createdAt: uploadDocument.createdAt
            }
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({
            success: false,
            message: 'File upload failed',
            error: err.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/files/:fileId - Download file from database
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        // Find the file in database
        const fileDocument = await Upload.findById(fileId);

        if (!fileDocument) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check if file is expired
        if (fileDocument.isExpired()) {
            return res.status(410).json({
                success: false,
                message: 'File has expired'
            });
        }

        // Check if file is public or user has access
        if (!fileDocument.isPublic && req.user && req.user.id !== fileDocument.uploadedBy.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Increment download count
        await fileDocument.incrementDownloadCount();

        // Convert base64 back to buffer
        const fileBuffer = Buffer.from(fileDocument.fileData, 'base64');

        // Set response headers for download
        res.setHeader('Content-Type', fileDocument.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="${fileDocument.originalName}"`);
        res.setHeader('Content-Length', fileBuffer.length);

        // Send the file
        res.send(fileBuffer);
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({
            success: false,
            message: 'File download failed',
            error: err.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/files/category/:category - Get all files by category
// ═══════════════════════════════════════════════════════════════════════════
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const skip = (page - 1) * limit;

        const files = await Upload.find({
            category: category,
            isPublic: true
        })
            .select('-fileData') // Don't return file data in list
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Upload.countDocuments({
            category: category,
            isPublic: true
        });

        res.json({
            success: true,
            files: files,
            pagination: {
                total: total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Category fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch files'
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/files/course/:courseId - Get files for a course
// ═══════════════════════════════════════════════════════════════════════════
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;

        const files = await Upload.find({
            course: courseId,
            isPublic: true
        })
            .select('-fileData')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            files: files,
            count: files.length
        });
    } catch (err) {
        console.error('Course files error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course files'
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/files/lesson/:lessonId - Get files for a lesson
// ═══════════════════════════════════════════════════════════════════════════
router.get('/lesson/:lessonId', async (req, res) => {
    try {
        const { lessonId } = req.params;

        const files = await Upload.find({
            lesson: lessonId,
            isPublic: true
        })
            .select('-fileData')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            files: files,
            count: files.length
        });
    } catch (err) {
        console.error('Lesson files error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lesson files'
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/files/:fileId - Delete file from database
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/:fileId', protect, async (req, res) => {
    try {
        const { fileId } = req.params;

        const fileDocument = await Upload.findById(fileId);

        if (!fileDocument) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check if user is file owner or admin
        if (req.user.id !== fileDocument.uploadedBy.toString() && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this file'
            });
        }

        await Upload.findByIdAndDelete(fileId);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file'
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/files/info/:fileId - Get file info (metadata only)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/info/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        const fileDocument = await Upload.findById(fileId)
            .select('-fileData')
            .populate('uploadedBy', 'fullName email');

        if (!fileDocument) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        res.json({
            success: true,
            file: {
                id: fileDocument._id,
                filename: fileDocument.originalName,
                mimetype: fileDocument.mimetype,
                size: fileDocument.getFileSizeInMB(),
                category: fileDocument.category,
                description: fileDocument.description,
                uploadedBy: fileDocument.uploadedBy,
                downloadCount: fileDocument.downloadCount,
                createdAt: fileDocument.createdAt,
                updatedAt: fileDocument.updatedAt
            }
        });
    } catch (err) {
        console.error('Info fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch file info'
        });
    }
});

module.exports = router;
