const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Multer setup for profile pictures ───────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safe = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');
        cb(null, safe);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

// ─── Generate JWT ─────────────────────────────────────────────────────────────
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─── PUBLIC: GET all teachers (for Landing page faculty directory) ─────────────
// GET /api/auth/teachers
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher', status: 'approved' })
            .select('name department designation bio profilePicture')
            .sort({ createdAt: 1 });
        res.json({ teachers });
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── REGISTER ────────────────────────────────────────────────────────────────
// POST /api/auth/register  (multipart/form-data)
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    try {
        const {
            name, email, password, role,
            // Student fields
            enrollmentNumber, course, studentType, group,
            majorSubject, minorSubject, openElective, projectType,
            // Teacher fields
            department, designation, bio,
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password, and role are required' });
        }

        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({ message: 'Role must be student or teacher' });
        }

        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Cleanup uploaded file if user already exists
            if (req.file) fs.unlinkSync(path.join(uploadDir, req.file.filename));
            return res.status(409).json({ message: 'Email already registered' });
        }

        // Student-specific validation
        if (role === 'student') {
            if (!enrollmentNumber || !course || !studentType || !group) {
                if (req.file) fs.unlinkSync(path.join(uploadDir, req.file.filename));
                return res.status(400).json({
                    message: 'Students must provide enrollment number, course, type, and group',
                });
            }
        }

        // Build user object
        const userData = {
            name,
            email,
            password,
            role,
            status: role === 'student' ? 'pending' : 'approved',
            profilePicture: req.file ? req.file.filename : '',
        };

        if (role === 'student') {
            userData.enrollmentNumber = enrollmentNumber;
            userData.course = course;
            userData.studentType = studentType;
            userData.group = group;
            if (majorSubject) userData.majorSubject = majorSubject;
            if (minorSubject) userData.minorSubject = minorSubject;
            if (openElective) userData.openElective = openElective;
            if (projectType) userData.projectType = projectType;
        } else {
            userData.department = department;
            userData.designation = designation;
            if (bio) userData.bio = bio;
        }

        const user = await User.create(userData);
        const token = generateToken(user._id);

        res.status(201).json({
            message:
                role === 'student'
                    ? 'Registration successful! Your account is pending verification by a teacher.'
                    : 'Teacher account created successfully!',
            token,
            user: {
                id: user._id, name: user.name, email: user.email,
                role: user.role, status: user.status,
                profilePicture: user.profilePicture,
                enrollmentNumber: user.enrollmentNumber, course: user.course,
                studentType: user.studentType, group: user.group,
                majorSubject: user.majorSubject, minorSubject: user.minorSubject,
                openElective: user.openElective, projectType: user.projectType,
                cceStatus: user.cceStatus,
                department: user.department, designation: user.designation, bio: user.bio,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.role !== role) {
            return res
                .status(401)
                .json({ message: `No ${role} account found with this email` });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id, name: user.name, email: user.email,
                role: user.role, status: user.status,
                profilePicture: user.profilePicture,
                enrollmentNumber: user.enrollmentNumber, course: user.course,
                studentType: user.studentType, group: user.group,
                majorSubject: user.majorSubject, minorSubject: user.minorSubject,
                openElective: user.openElective, projectType: user.projectType,
                cceStatus: user.cceStatus,
                department: user.department, designation: user.designation, bio: user.bio,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// ─── GET ME ───────────────────────────────────────────────────────────────────
// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    res.json({ user: req.user });
});

// ─── UPDATE PROFILE PICTURE ───────────────────────────────────────────────────
// PATCH /api/auth/profile-picture
router.patch('/profile-picture', protect, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

        // Delete old picture if exists
        const oldUser = await User.findById(req.user._id);
        if (oldUser.profilePicture) {
            const oldPath = path.join(uploadDir, oldUser.profilePicture);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture: req.file.filename },
            { new: true }
        ).select('-password');

        res.json({ message: 'Profile picture updated', user });
    } catch (error) {
        console.error('Profile picture update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
