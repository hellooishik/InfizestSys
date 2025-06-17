const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/publicTaskController');
const { requireLogin, requireAdmin } = require('../utils/authMiddleware');
const TaskRequest = require('../models/TaskRequest');
const User = require('../models/User');

// ✅ Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ✅ Admin: Post public task
router.post(
  '/admin/public-task',
  requireAdmin,
  upload.single('document'), // ⬅️ accept one file with name 'document'
  controller.createPublicTask
);

// ✅ Admin: Approve request
router.post('/admin/approve-request', requireAdmin, controller.approveTaskRequest);

// ✅ Public: Get all public tasks
router.get('/tasks/public', controller.getAllPublicTasks);

// ✅ Logged-in User: Request to do task
router.post('/tasks/request', requireLogin, controller.requestToDo);

// ✅ Admin: Get all public task requests
// ✅ Admin: Get all public task requests
router.get('/public-tasks/requests', requireAdmin, async (req, res) => {
  try {
    const requests = await TaskRequest.find()
      .populate('userId', 'name loginId')
      .populate('taskId') // ✅ ADD THIS LINE
      .sort({ requestedAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error('Error loading public task requests:', err);
    res.status(500).json({ message: 'Failed to load task requests' });
  }
});
// ✅ PUT /api/public-tasks/requests/:id - Admin approves or rejects request
router.put('/public-tasks/requests/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  try {
    const request = await TaskRequest.findById(id).populate('userId');
    if (!request) {
      return res.status(404).json({ message: 'Task request not found' });
    }

    request.status = action === 'approve' ? 'Approved' : 'Rejected';
    await request.save();

    res.status(200).json({ message: `Request ${action}d successfully`, request });
  } catch (err) {
    console.error('Error approving public task request:', err);
    res.status(500).json({ message: 'Failed to process approval' });
  }
});


module.exports = router;
