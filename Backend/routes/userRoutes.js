const express = require('express');
const router = express.Router();
const { requireLogin } = require('../utils/authMiddleware');
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { getMyTasks } = require('../controllers/taskController'); // ✅ import added

router.get('/me', requireLogin, getUserProfile);
router.put('/edit', requireLogin, updateUserProfile);

// ✅ New route for fetching all tasks relevant to a logged-in user
router.get('/tasks/my', requireLogin, getMyTasks);
// userRoutes.js
router.get('/my-public-requests', requireLogin, async (req, res) => {
  const TaskRequest = require('../models/TaskRequest');
  const PublicTask = require('../models/PublicTask');

  try {
    const requests = await TaskRequest.find({ userId: req.session.userId }).populate('taskId');
    
    const result = requests.map(r => ({
      _id: r._id,
      status: r.status,
      task: {
        taskId: r.taskId?.taskId || '',
        topic: r.taskId?.topic || '',
        wordCount: r.taskId?.wordCount || 0,
        estimatedQuote: r.taskId?.estimatedQuote || 0,
        documentPath: r.taskId?.documentPath || ''
      }
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error('Error loading public task requests:', err);
    res.status(500).json({ message: 'Failed to load task requests' });
  }
});

const TaskRequest = require('../models/TaskRequest'); // ✅ import added
const User = require('../models/User'); // ✅ import added  
module.exports = router;
