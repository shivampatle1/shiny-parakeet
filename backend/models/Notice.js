const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        priority: {
            type: String,
            enum: ['normal', 'urgent'],
            default: 'normal',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
