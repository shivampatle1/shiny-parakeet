const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const noticeRoutes = require('./routes/notices');
const messageRoutes = require('./routes/messages');
const galleryRoutes = require('./routes/gallery');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/gallery', galleryRoutes);

app.get('/', (req, res) => res.json({ message: 'College Portal API running 🎓' }));

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedNotices();
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error('❌ MongoDB connection failed:', err));

// Seed sample notices on startup
async function seedNotices() {
  const Notice = require('./models/Notice');
  const count = await Notice.countDocuments();
  if (count === 0) {
    await Notice.insertMany([
      { text: '🎓 Semester Examinations for B.Sc. & B.Com begin on 10th March 2024' },
      { text: '📢 Annual Cultural Fest "Utsav 2024" — Register before 5th March' },
      { text: '⚠️ Fee payment deadline extended to 28th February 2024' },
      { text: '📚 Library will remain closed on 26th February for stock verification' },
      { text: '🏆 Congratulations to students who cleared NET/SET examinations!' },
      { text: '📝 Practical examination schedule posted on the notice board' },
      { text: '🚌 New bus route from Bus Stand to College effective from Monday' },
    ]);
    console.log('✅ Sample notices seeded');
  }
}
