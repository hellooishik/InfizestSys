const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// routes
router.post('/register-admin', authController.registerAdmin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/session', authController.sessionInfo);

// The export modules 
module.exports = router;
