const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect); // All message routes require auth

// ─── POST /api/messages/send ──────────────────────────────────────────────────
// Send a message to another user
router.post('/send', async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        if (!receiverId || !content?.trim()) {
            return res.status(400).json({ message: 'receiverId and content are required' });
        }

        // Verify receiver exists
        const receiver = await User.findById(receiverId).select('name role');
        if (!receiver) return res.status(404).json({ message: 'Recipient not found' });

        const msg = await Message.create({
            senderId: req.user._id,
            receiverId,
            content: content.trim(),
        });

        const populated = await msg.populate([
            { path: 'senderId', select: 'name role profilePicture' },
            { path: 'receiverId', select: 'name role profilePicture' },
        ]);

        res.status(201).json({ message: 'Message sent', msg: populated });
    } catch (e) {
        console.error('Send message error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /api/messages/conversation/:userId ───────────────────────────────────
// Get full conversation with a specific user
router.get('/conversation/:userId', async (req, res) => {
    try {
        const me = req.user._id;
        const other = req.params.userId;

        const messages = await Message.find({
            $or: [
                { senderId: me, receiverId: other },
                { senderId: other, receiverId: me },
            ],
        })
            .populate('senderId', 'name role profilePicture')
            .populate('receiverId', 'name role profilePicture')
            .sort({ createdAt: 1 });

        // Mark incoming messages as read
        await Message.updateMany(
            { senderId: other, receiverId: me, read: false },
            { read: true }
        );

        res.json({ messages });
    } catch (e) {
        console.error('Get conversation error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /api/messages/inbox ──────────────────────────────────────────────────
// List unique conversations for the current user (most recent message per contact)
router.get('/inbox', async (req, res) => {
    try {
        const me = req.user._id;

        // Find all messages involving me
        const messages = await Message.find({
            $or: [{ senderId: me }, { receiverId: me }],
        })
            .populate('senderId', 'name role profilePicture department designation')
            .populate('receiverId', 'name role profilePicture department designation')
            .sort({ createdAt: -1 });

        // Build unique conversation list (one entry per contact)
        const convMap = {};
        for (const msg of messages) {
            const other =
                msg.senderId._id.toString() === me.toString()
                    ? msg.receiverId
                    : msg.senderId;
            const key = other._id.toString();
            if (!convMap[key]) {
                const unreadCount = await Message.countDocuments({
                    senderId: other._id,
                    receiverId: me,
                    read: false,
                });
                convMap[key] = {
                    contact: other,
                    lastMessage: { content: msg.content, createdAt: msg.createdAt },
                    unreadCount,
                };
            }
        }

        res.json({ conversations: Object.values(convMap) });
    } catch (e) {
        console.error('Inbox error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PATCH /api/messages/read/:userId ────────────────────────────────────────
// Mark all messages from a user as read
router.patch('/read/:userId', async (req, res) => {
    try {
        await Message.updateMany(
            { senderId: req.params.userId, receiverId: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: 'Messages marked as read' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /api/messages/unread-count ──────────────────────────────────────────
// Total unread message count for badge in nav
router.get('/unread-count', async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiverId: req.user._id,
            read: false,
        });
        res.json({ count });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
