const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app'); // Your Express app with routes & middleware
const publicTaskRoutes = require('./routes/publicTaskRoutes');

const PORT = process.env.PORT || 5000;

// ⬇️ API Routes
app.use('/api', publicTaskRoutes);

// ⬇️ Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'ui', 'build');
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// ⬇️ Create HTTP server
const server = http.createServer(app);

// ⬇️ Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // or replace with your production domain
    credentials: true
  }
});

global._io = io;

io.on('connection', (socket) => {
  console.log('⚡ New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ⬇️ MongoDB Connection
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
