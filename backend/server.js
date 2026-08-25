const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
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
const securityRoutes = require('./routes/security');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const { verifyToken } = require('./lib/auth');

// Socket.IO Server Configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Authenticated Connection & Room Handler
io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token;
  let authenticatedUser = null;
  if (token) {
    authenticatedUser = verifyToken(token);
  }

  if (authenticatedUser && authenticatedUser.userId) {
    const userRoom = `user_${authenticatedUser.userId}`;
    socket.join(userRoom);
    console.log(`🔌 Socket.IO client connected: ${socket.id} (User ID: ${authenticatedUser.userId}, Room: ${userRoom})`);
  } else {
    console.log(`🔌 Socket.IO client connected: ${socket.id} (Unauthenticated)`);
  }

  socket.on('join', (data) => {
    const tokenToVerify = data?.token || socket.handshake.auth?.token;
    if (tokenToVerify) {
      const user = verifyToken(tokenToVerify);
      if (user && user.userId) {
        const userRoom = `user_${user.userId}`;
        socket.join(userRoom);
        console.log(`👤 Socket ${socket.id} verified and joined room ${userRoom}`);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket.IO client disconnected: ${socket.id}`);
  });
});

// Attach io instance to app for future event emissions in routes
app.set('io', io);

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes (100% Unchanged)
app.use('/api/auth', authRoutes);
app.use('/api/outpass', outpassRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/security', securityRoutes);

// Root status
app.get('/', (req, res) => {
  res.json({
    message: '🏛️ Lendi Portal Backend API Server is running!',
    status: 'online',
    frontend: 'http://localhost:3000',
    health: 'http://localhost:5000/api/health',
    realtime: 'Socket.IO enabled'
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`🚀 Lendi Backend API server running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.IO real-time server listening on port ${PORT}`);
});
