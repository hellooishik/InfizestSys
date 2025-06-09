const express = require('express');
const router = express.Router();
const { requireAdmin, requireLogin } = require('../utils/authMiddleware');
const {
  listUsers,
  deleteUser,
  updateUser,
  approveUser,
  denyUser,
  exportCSV,
  addUser,
  getAllTasks,
  approveOrRejectLog // ✅ Add this here
} = require('../controllers/adminController');
const Log = require('../models/Log');
const moment = require('moment');

// 🧑‍💼 User Management
router.get('/users', requireAdmin, listUsers);
router.post('/users', requireAdmin, addUser);
router.delete('/users/:id', requireAdmin, deleteUser);
router.put('/users/:id', requireAdmin, updateUser);

// ✅ Approval (Deprecated old routes — keep only the new one below if preferred)
router.put('/approval/:id', requireAdmin, approveOrRejectLog); // Used by frontend
// router.post('/approve/:id', requireAdmin, approveUser); // Optional legacy
// router.post('/deny/:id', requireAdmin, denyUser);       // Optional legacy

// 🧾 CSV Export
router.get('/export/csv', requireAdmin, exportCSV);

// 📌 Task Management
router.get('/tasks', requireAdmin, getAllTasks);

// 🕒 Today's Logs for Admin Dashboard
router.get('/logs/today', requireLogin, requireAdmin, async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const logs = await Log.find({ logDate: today });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
