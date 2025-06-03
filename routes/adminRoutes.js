const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../utils/authMiddleware');
const {
  listUsers,
  deleteUser,
  updateUser,
  approveUser,
  denyUser,
  exportCSV
} = require('../controllers/adminController');

router.get('/users', requireAdmin, listUsers);
router.delete('/users/:id', requireAdmin, deleteUser);
router.put('/users/:id', requireAdmin, updateUser);
router.post('/approve/:id', requireAdmin, approveUser);
router.post('/deny/:id', requireAdmin, denyUser);
router.get('/export/csv', requireAdmin, exportCSV);

module.exports = router;
