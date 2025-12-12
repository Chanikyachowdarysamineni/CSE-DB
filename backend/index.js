const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
require('dotenv').config();
const connectMongo = require('./config/mongo');

// Connect to MongoDB
connectMongo();

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io available to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(express.json());


app.get('/', (req, res) => {
  res.send('CSE Department Backend API Running');
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/init', require('./routes/init'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/events', require('./routes/events'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/forums', require('./routes/forums'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log('🔌 Socket.io enabled for real-time updates');
});
