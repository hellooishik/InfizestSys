const express = require('express');
const router = express.Router();
const { requireLogin, requireAdmin } = require('../utils/authMiddleware');
const taskController = require('../controllers/taskController');

router.post(
  '/',
  requireAdmin,
  taskController.uploadMiddleware,
  taskController.createTask
);
router.put('/:id/status', requireAdmin, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  task.status = req.body.status;
  await task.save();
  res.json({ success: true });
});
router.get('/my', requireLogin, taskController.getMyTasks);
router.post('/:id/submit', requireLogin, taskController.submitTask);
router.post('/:id/reject', requireLogin, taskController.rejectTask);

module.exports = router;
 