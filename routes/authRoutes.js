const express = require('express');
const router = express.Router();
const { login, logout, sessionInfo } = require('../controllers/authController');

router.post('/login', login);
router.post('/logout', logout);
router.get('/session', sessionInfo);

module.exports = router;
