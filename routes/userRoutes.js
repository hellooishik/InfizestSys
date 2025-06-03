const express = require('express');
const router = express.Router();
const { requireLogin } = require('../utils/authMiddleware');
const { getUserProfile, updateUserProfile } = require('../controllers/userController');

router.get('/me', requireLogin, getUserProfile);
router.put('/edit', requireLogin, updateUserProfile);

module.exports = router;
