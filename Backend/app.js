const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const taskRoutes = require('./routes/taskRoutes');
require('dotenv').config();

const app = express();

// ✅ Fix: Allow both local and deployed frontend
const allowedOrigins = [
  'http://localhost:3000',
  'https://infizestcrm.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('✅ Welcome to Infizest Backend!');
});

// ✅ Serve uploads
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'ett_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: false, // Consider true in production with HTTPS
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use('/api/tasks', taskRoutes);
app.use('/api', routes);
app.use('/api', require('./routes/publicTaskRoutes'));

module.exports = app;
