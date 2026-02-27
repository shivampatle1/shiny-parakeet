const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // Teacher fills these on resolution
    rejectionReason: { type: String, trim: true, default: '' },
    sharedText: { type: String, trim: true, default: '' },  // text response when approved
    sharedFile: { type: String, default: '' },               // filename when approved with file
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);
