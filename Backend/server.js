const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = require('./app'); // Your Express app with routes & middleware
require('dotenv').config();
const publicTaskRoutes = require('./routes/publicTaskRoutes');
app.use('/api', publicTaskRoutes);

const PORT = process.env.PORT || 5000;

// ⬇️ Create HTTP server from Express app
const server = http.createServer(app);

// ⬇️ Setup Socket.IO server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});
app.get('/', (req, res) => {
  res.send('✅ Welcome to Infizest Backend!');
});
// ⬇️ Global reference to emit from any controller
global._io = io;

// ⬇️ Basic connection event for debugging
io.on('connection', (socket) => {
  console.log('⚡ New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ⬇️ MongoDB connection and start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err);
});
