const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GalleryImage = require('../models/GalleryImage');
const { protect } = require('../middleware/auth');

// ── Multer setup (reuse uploads folder) ──────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `gallery-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

// ── GET /api/gallery  (public) ────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const images = await GalleryImage.find()
            .sort({ createdAt: -1 })
            .populate('uploadedBy', 'name role department designation');
        res.json({ images });
    } catch (err) {
        console.error('Gallery fetch error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── POST /api/gallery/upload  (authenticated – teacher or student) ─────────────
router.post('/upload', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image' });
        }

        const { title = '', description = '' } = req.body;

        const image = await GalleryImage.create({
            filename: req.file.filename,
            title: title.trim(),
            description: description.trim(),
            uploadedBy: req.user._id,
            uploaderName: req.user.name,
            uploaderRole: req.user.role,
        });

        const populated = await image.populate('uploadedBy', 'name role department designation');
        res.status(201).json({ message: 'Image uploaded', image: populated });
    } catch (err) {
        // Cleanup uploaded file on error
        if (req.file) {
            fs.unlink(path.join(__dirname, '..', 'uploads', req.file.filename), () => { });
        }
        console.error('Gallery upload error:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// ── DELETE /api/gallery/:id  (uploader or teacher) ───────────────────────────
router.delete('/:id', protect, async (req, res) => {
    try {
        const image = await GalleryImage.findById(req.params.id);
        if (!image) return res.status(404).json({ message: 'Image not found' });

        // Allow: uploader themselves, or any teacher
        const isOwner = image.uploadedBy.toString() === req.user._id.toString();
        const isTeacher = req.user.role === 'teacher';
        if (!isOwner && !isTeacher) {
            return res.status(403).json({ message: 'Not authorised to delete this image' });
        }

        // Remove file from disk
        const filePath = path.join(__dirname, '..', 'uploads', image.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await image.deleteOne();
        res.json({ message: 'Image deleted' });
    } catch (err) {
        console.error('Gallery delete error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
