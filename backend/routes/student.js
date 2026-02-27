const express = require('express');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Attendance = require('../models/Attendance');
const AttendanceRequest = require('../models/AttendanceRequest');
const Material = require('../models/Material');
const MaterialRequest = require('../models/MaterialRequest');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(protect, requireRole('student'));

// GET /api/student/profile
router.get('/profile', async (req, res) => {
    try {
        const student = await User.findById(req.user._id).select('-password');
        res.json({ student });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/student/announcements — group-filtered
router.get('/announcements', async (req, res) => {
    try {
        const student = await User.findById(req.user._id).select('group');
        const announcements = await Announcement.find({
            $or: [{ targetGroup: 'all' }, { targetGroup: student.group }],
        })
            .populate('createdBy', 'name designation department')
            .sort({ createdAt: -1 })
            .limit(30);
        res.json({ announcements });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/student/materials — filtered by targetType/group/studentId
router.get('/materials', async (req, res) => {
    try {
        const student = await User.findById(req.user._id).select('group');
        const materials = await Material.find({
            $or: [
                { targetType: 'all' },
                { targetType: 'group', targetGroups: student.group },
                { targetType: 'students', targetStudents: req.user._id },
            ],
        }).sort({ createdAt: -1 });
        res.json({ materials });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/student/attendance
router.get('/attendance', async (req, res) => {
    try {
        const records = await Attendance.find({ studentId: req.user._id }).sort({ date: -1 });
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = total - present;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        res.json({ records, summary: { total, present, absent, percentage } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/student/attendance-request
router.post('/attendance-request', async (req, res) => {
    try {
        const { date, reason } = req.body;
        if (!date || !reason) return res.status(400).json({ message: 'Date and reason are required' });
        const existing = await AttendanceRequest.findOne({ studentId: req.user._id, date, status: 'pending' });
        if (existing) return res.status(400).json({ message: 'A request for this date is already pending' });
        const request = await AttendanceRequest.create({ studentId: req.user._id, date, reason });
        res.status(201).json({ message: 'Correction request sent to teacher', request });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/student/attendance-requests
router.get('/attendance-requests', async (req, res) => {
    try {
        const requests = await AttendanceRequest.find({ studentId: req.user._id }).sort({ createdAt: -1 }).limit(10);
        res.json({ requests });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/student/material-request — student requests material from teacher
router.post('/material-request', async (req, res) => {
    try {
        const { topic, description } = req.body;
        if (!topic) return res.status(400).json({ message: 'Topic is required' });
        const request = await MaterialRequest.create({
            studentId: req.user._id,
            topic,
            description: description || '',
        });
        res.status(201).json({ message: 'Material request sent to teacher', request });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/student/material-requests — own request history incl. received materials
router.get('/material-requests', async (req, res) => {
    try {
        const requests = await MaterialRequest.find({ studentId: req.user._id })
            .sort({ createdAt: -1 });
        res.json({ requests });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
