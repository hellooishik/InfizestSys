const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/publicTaskController');
const { requireLogin, requireAdmin } = require('../utils/authMiddleware');
const TaskRequest = require('../models/TaskRequest');

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

/* --------------------------- 🔐 Admin Routes --------------------------- */

// ✅ Admin: Create a public task
router.post(
  '/admin/public-task',
  requireAdmin,
  upload.single('document'),
  controller.createPublicTask
);

// ✅ Admin: View all task requests
router.get('/admin/public-requests', requireAdmin, async (req, res) => {
  try {
    const requests = await TaskRequest.find()
      .populate('userId', 'name loginId')
      .populate('taskId')
      .sort({ requestedAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error('❌ Error loading public task requests:', err);
    res.status(500).json({ message: 'Failed to load task requests' });
  }
});

// ✅ Admin: Approve or reject a task request
router.put('/admin/public-requests/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  try {
    const request = await TaskRequest.findById(id).populate('userId');
    if (!request) {
      return res.status(404).json({ message: 'Task request not found' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    request.status = action === 'approve' ? 'Approved' : 'Rejected';
    await request.save();

    res.status(200).json({ message: `Request ${action}d successfully`, request });
  } catch (err) {
    console.error('❌ Error approving/rejecting request:', err);
    res.status(500).json({ message: 'Failed to process approval' });
  }
});

/* ------------------------ 👥 User/Public Routes ------------------------ */

// ✅ Get all public tasks
router.get('/tasks/public', controller.getAllPublicTasks);


// ✅ Logged-in user: Request to do a task
router.post('/tasks/request', requireLogin, controller.requestToDo);

// ✅ Logged-in user: View own public task requests
router.get('/user/my-public-requests', requireLogin, async (req, res) => {
  try {
    const requests = await TaskRequest.find({ userId: req.user._id })
      .populate('taskId') // You only need task details here
      .sort({ requestedAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.error('❌ Failed to fetch user requests:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
