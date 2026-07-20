const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const outpassRoutes = require('./routes/outpass');
const teacherRoutes = require('./routes/teacher');
const hodRoutes = require('./routes/hod');
const attendanceRoutes = require('./routes/attendance');
const notificationRoutes = require('./routes/notifications');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/outpass', outpassRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

// Root status
app.get('/', (req, res) => {
  res.json({
    message: '🏛️ Lendi Portal Backend API Server is running!',
    status: 'online',
    frontend: 'http://localhost:3000',
    health: 'http://localhost:5000/api/health'
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.listen(PORT, () => {
  console.log(`🚀 Lendi Backend API server running on http://localhost:${PORT}`);
});
