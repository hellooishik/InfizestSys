const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const taskRoutes = require('./routes/taskRoutes');
require('dotenv').config();

const app = express();

// ✅ Allowed frontend domains (local + deployed React app)
const allowedOrigins = [
  'http://localhost:3000',
  'https://infizestcrm.onrender.com'
];

// ✅ CORS Setup to support cookies (credentials)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());

// ✅ Welcome route
app.get('/', (req, res) => {
  res.send('✅ Welcome to Infizest Backend!');
});

// ✅ Static file access (e.g., uploads/docs)
app.use('/uploads', express.static('uploads'));

// ✅ Session setup for cross-origin secure login/session
app.use(session({
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

// ✅ API routes
app.use('/api/tasks', taskRoutes);
app.use('/api', routes);
app.use('/api', require('./routes/publicTaskRoutes'));

module.exports = app;
