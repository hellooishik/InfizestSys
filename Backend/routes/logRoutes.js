const express = require('express');
const router = express.Router();
const { requireLogin } = require('../utils/authMiddleware');
const logController = require('../controllers/logController'); // ✅ Import the whole controller

router.post('/', requireLogin, logController.logTimeEvent);
router.get('/session', requireLogin, logController.getSessionStatus);
router.get('/approval', requireLogin, logController.checkApproval);
router.post('/ask', requireLogin, logController.askForApproval);
router.post('/admin/approve', logController.adminApproveResume); // ✅ Fixed

module.exports = router;
