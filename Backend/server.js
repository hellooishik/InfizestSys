const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app'); // Main Express app with routes
const publicTaskRoutes = require('./routes/publicTaskRoutes');

const PORT = process.env.PORT || 5000;

// ✅ Append additional route AFTER app is defined
app.use('/api', publicTaskRoutes); // Only if not already in app.js (don't duplicate)

const server = http.createServer(app);

// ✅ Use dynamic CORS origin handling in Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://infizestcrm.onrender.com' // your React frontend
    ],
    credentials: true
  }
});

// ✅ Optional: Avoid redefining '/' route (already defined in app.js)
app.get('/', (req, res) => {
  res.send('✅ Welcome to Infizest Backend!');
});

// ✅ Make socket.io globally accessible
global._io = io;

// ✅ Connection events
io.on('connection', (socket) => {
  console.log('⚡ New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ✅ Connect to MongoDB and start the server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err);
});
