const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String },
    displayName: { type: String },
    title: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Targeting
    targetType: { type: String, enum: ['all', 'group', 'students'], default: 'all' },
    targetGroups: [{ type: String }],
    targetStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
