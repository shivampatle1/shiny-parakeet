const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
        },
        role: {
            type: String,
            enum: ['student', 'teacher'],
            required: true,
        },

        // Student-specific fields
        enrollmentNumber: { type: String, trim: true },
        course: { type: String, trim: true },
        studentType: { type: String, enum: ['Regular', 'Private'] },
        group: { type: String, trim: true },
        majorSubject: { type: String, trim: true, default: '' },
        minorSubject: { type: String, trim: true, default: '' },
        openElective: { type: String, trim: true, default: '' },
        cceStatus: { type: String, enum: ['pending', 'complete', 'exempted'], default: 'pending' },
        projectType: { type: String, enum: ['Project', 'Internship', ''], default: '' },
        // Profile Picture
        profilePicture: {
            type: String,
            default: '',
        },

        // Teacher-specific fields
        department: {
            type: String,
            trim: true,
        },
        designation: {
            type: String,
            trim: true,
        },
        bio: {
            type: String,
            trim: true,
            default: '',
        },

        // Verification status (for students)
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'approved', // teachers are auto-approved
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
