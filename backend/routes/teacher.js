const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Attendance = require('../models/Attendance');
const AttendanceRequest = require('../models/AttendanceRequest');
const Material = require('../models/Material');
const MaterialRequest = require('../models/MaterialRequest');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(protect, requireRole('teacher'));

// ─── Multer setup ──────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safe = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');
        cb(null, safe);
    },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────
// STUDENT MANAGEMENT
// ─────────────────────────────────────────────────────────

router.get('/pending', async (req, res) => {
    try {
        const students = await User.find({ role: 'student', status: 'pending' }).select('-password').sort({ createdAt: -1 });
        res.json({ students });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/students', async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
        res.json({ students });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.patch('/approve/:id', async (req, res) => {
    try {
        const student = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'student' },
            { status: 'approved' }, { new: true }
        ).select('-password');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: `${student.name} has been approved`, student });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.patch('/reject/:id', async (req, res) => {
    try {
        const student = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'student' },
            { status: 'rejected' }, { new: true }
        ).select('-password');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: `${student.name} has been rejected`, student });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.patch('/student/:id', async (req, res) => {
    try {
        const allowed = ['name', 'enrollmentNumber', 'course', 'studentType', 'group',
            'majorSubject', 'minorSubject', 'openElective', 'cceStatus',
            'projectType', 'status'];
        const updates = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        const student = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'student' }, updates, { new: true, runValidators: true }
        ).select('-password');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student updated', student });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/student/:id', async (req, res) => {
    try {
        const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: `${student.name} removed from the system` });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/assign-subjects', async (req, res) => {
    try {
        const { group, majorSubject, minorSubject, openElective } = req.body;
        if (!group) return res.status(400).json({ message: 'Group is required' });
        const result = await User.updateMany(
            { role: 'student', group },
            { $set: { majorSubject, minorSubject, openElective } }
        );
        res.json({ message: `Subjects assigned to ${result.modifiedCount} students in ${group}` });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/groups', async (req, res) => {
    try {
        const groups = await User.distinct('group', { role: 'student', group: { $ne: '' } });
        res.json({ groups });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// ─────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────

router.post('/announce', async (req, res) => {
    try {
        const { text, category, targetGroup } = req.body;
        if (!text) return res.status(400).json({ message: 'Message text is required' });
        const ann = await Announcement.create({
            text, category: category || 'General',
            targetGroup: targetGroup || 'all',
            createdBy: req.user._id,
        });
        res.status(201).json({ message: 'Announcement sent', announcement: ann });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 }).limit(50);
        res.json({ announcements });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// ─────────────────────────────────────────────────────────
// FILE UPLOADS — using Material model for targeting
// ─────────────────────────────────────────────────────────

// POST /api/teacher/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try {
        const { title, targetType, targetGroups, targetStudents } = req.body;

        const material = await Material.create({
            filename: req.file.filename,
            originalName: req.file.originalname,
            displayName: req.file.originalname.replace(/\.[^.]+$/, ''),
            title: title || req.file.originalname,
            size: req.file.size,
            uploadedBy: req.user._id,
            targetType: targetType || 'all',
            targetGroups: targetGroups ? JSON.parse(targetGroups) : [],
            targetStudents: targetStudents ? JSON.parse(targetStudents) : [],
        });

        res.status(201).json({ message: 'File uploaded successfully', material });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/teacher/uploads
router.get('/uploads', async (req, res) => {
    try {
        const materials = await Material.find()
            .populate('targetStudents', 'name enrollmentNumber')
            .sort({ createdAt: -1 });
        res.json({ materials });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/teacher/uploads/:id
router.delete('/uploads/:id', async (req, res) => {
    try {
        const material = await Material.findByIdAndDelete(req.params.id);
        if (!material) return res.status(404).json({ message: 'File not found' });
        // Also delete from disk
        const filePath = path.join(uploadDir, material.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.json({ message: 'File deleted' });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// ─────────────────────────────────────────────────────────
// MATERIAL REQUESTS
// ─────────────────────────────────────────────────────────

// GET /api/teacher/material-requests
router.get('/material-requests', async (req, res) => {
    try {
        const requests = await MaterialRequest.find()
            .populate('studentId', 'name enrollmentNumber group')
            .sort({ createdAt: -1 });
        res.json({ requests });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// PATCH /api/teacher/material-requests/:id  — approve (with text/file) or reject
router.patch('/material-requests/:id', upload.single('file'), async (req, res) => {
    try {
        const { status, rejectionReason, sharedText } = req.body;
        const updates = {
            status, resolvedBy: req.user._id, resolvedAt: new Date(),
        };
        if (status === 'rejected') updates.rejectionReason = rejectionReason || '';
        if (status === 'approved') {
            if (sharedText) updates.sharedText = sharedText;
            if (req.file) updates.sharedFile = req.file.filename;
        }

        const request = await MaterialRequest.findByIdAndUpdate(req.params.id, updates, { new: true })
            .populate('studentId', 'name');
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json({ message: `Request ${status}`, request });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────

router.get('/attendance', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const filter = { role: 'student', status: 'approved' };
        if (req.query.group && req.query.group !== 'all') filter.group = req.query.group;
        const students = await User.find(filter).select('-password');
        const records = await Attendance.find({ date });
        const recordMap = {};
        records.forEach(r => { recordMap[r.studentId.toString()] = r.status; });
        const attendance = students.map(s => ({
            studentId: s._id, name: s.name, enrollmentNumber: s.enrollmentNumber,
            group: s.group, status: recordMap[s._id.toString()] || null,
        }));
        res.json({ attendance, date });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/attendance', async (req, res) => {
    try {
        const { date, records } = req.body;
        if (!date || !records?.length)
            return res.status(400).json({ message: 'date and records[] are required' });
        const ops = records.map(r => ({
            updateOne: {
                filter: { studentId: r.studentId, date },
                update: { $set: { status: r.status, markedBy: req.user._id } },
                upsert: true,
            },
        }));
        await Attendance.bulkWrite(ops);
        res.json({ message: `Attendance saved for ${records.length} students on ${date}` });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/attendance-requests', async (req, res) => {
    try {
        const requests = await AttendanceRequest.find({ status: 'pending' })
            .populate('studentId', 'name enrollmentNumber group')
            .sort({ createdAt: -1 });
        res.json({ requests });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.patch('/attendance-requests/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const request = await AttendanceRequest.findByIdAndUpdate(
            req.params.id, { status }, { new: true }
        ).populate('studentId', 'name');
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (status === 'approved') {
            await Attendance.findOneAndUpdate(
                { studentId: request.studentId._id, date: request.date },
                { $set: { status: 'present', markedBy: req.user._id } },
                { upsert: true }
            );
        }
        res.json({ message: `Request ${status}`, request });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
