const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const taskRoutes = require('./routes/taskRoutes');
require('dotenv').config();

const app = express();

// ✅ Allowed frontend domains
const allowedOrigins = [
  'http://localhost:3000',
  'https://infizestcrm.onrender.com'
];

// ✅ CORS Setup (logs and matches partial origins safely)
app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 Incoming origin:', origin);
    
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      console.error('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ Parse JSON request bodies
app.use(bodyParser.json());

// ✅ Static file access
app.use('/uploads', express.static('uploads'));

// ✅ Session setup
app.use(session({
  name: 'infizest.sid',
  secret: process.env.SESSION_SECRET || 'ett_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// ✅ Welcome route
app.get('/', (req, res) => {
  res.send('✅ Welcome to Infizest Backend!');
});

// ✅ API routes
app.use('/api/tasks', taskRoutes);
app.use('/api', routes);
app.use('/api', require('./routes/publicTaskRoutes'));

module.exports = app;
