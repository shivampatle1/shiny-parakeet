const express = require('express');
const Notice = require('../models/Notice');

const router = express.Router();

// GET /api/notices — get all active notices
router.get('/', async (req, res) => {
    try {
        const notices = await Notice.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ notices });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
