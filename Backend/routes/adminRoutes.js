const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../utils/authMiddleware');
const {
  listUsers,
  deleteUser,
  updateUser,
  approveUser,
  denyUser,
  exportCSV,
  addUser,
  getAllTasks
} = require('../controllers/adminController');

router.get('/users', requireAdmin, listUsers);
router.post('/users', requireAdmin, addUser); // ✅ direct use of addUser
router.delete('/users/:id', requireAdmin, deleteUser);
router.put('/users/:id', requireAdmin, updateUser);
router.post('/approve/:id', requireAdmin, approveUser);
router.post('/deny/:id', requireAdmin, denyUser);
router.get('/export/csv', requireAdmin, exportCSV);
router.get('/tasks', requireAdmin, getAllTasks); // ✅ FIXED!
// Users
router.get('/users', requireAdmin, listUsers);
router.post('/users', requireAdmin, addUser);
router.delete('/users/:id', requireAdmin, deleteUser);
router.put('/users/:id', requireAdmin, updateUser);

// Time log approval
router.post('/approve/:id', requireAdmin, approveUser);
router.post('/deny/:id', requireAdmin, denyUser);

// CSV Export
router.get('/export/csv', requireAdmin, exportCSV);

// Tasks
router.get('/tasks', requireAdmin, getAllTasks);

module.exports = router;
