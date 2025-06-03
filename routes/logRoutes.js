const express = require('express');
const router = express.Router();
const { requireLogin } = require('../utils/authMiddleware');
const {
  logTimeEvent,
  getSessionStatus,
  checkApproval,
  requestApproval
} = require('../controllers/logController');

router.post('/', requireLogin, logTimeEvent);
router.get('/session', requireLogin, getSessionStatus);
router.get('/approval', requireLogin, checkApproval);
router.post('/ask', requireLogin, requestApproval);

module.exports = router;
