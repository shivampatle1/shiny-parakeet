const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema(
    {
        filename: { type: String, required: true },
        title: { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '' },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        uploaderName: { type: String },
        uploaderRole: { type: String, enum: ['student', 'teacher'] },
    },
    { timestamps: true }
);

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
