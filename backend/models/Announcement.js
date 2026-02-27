const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: ['CCE', 'Project', 'Internship', 'Exam', 'General'],
        default: 'General',
    },
    targetGroup: { type: String, default: 'all' }, // 'all' or specific group name
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
