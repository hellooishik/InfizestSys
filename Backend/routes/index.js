const express = require('express');
const router = express.Router();
const taskRoutes = require('./taskRoutes');
router.use('/auth', require('./authRoutes'));
router.use('/user', require('./userRoutes'));
router.use('/log', require('./logRoutes'));
router.use('/admin', require('./adminRoutes'));


module.exports = router;
