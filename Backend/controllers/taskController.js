const Task = require('../models/Task');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure 'uploads/' directory exists
const UPLOAD_DIR = 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage }).array('files');

exports.uploadMiddleware = upload;

exports.createTask = async (req, res) => {
  try {
    console.log('📥 Task upload request received');
    console.log('BODY:', req.body);
    console.log('FILES:', req.files);

    const { jobId, loginId, deadline, googleDocsLink } = req.body;

    if (!jobId || !loginId || !deadline) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const files = req.files ? req.files.map(file => file.filename) : [];

    const user = await User.findOne({ loginId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const task = new Task({
      jobId,
      assignedTo: user._id,
      deadline,
      files,
      googleDocsLink
    });

    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    console.error('❌ Task creation failed:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.session.userId }).sort({ deadline: 1 });
    res.json(tasks);
  } catch (err) {
    console.error('❌ Failed to fetch tasks:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.submitTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!task.assignedTo.equals(req.session.userId))
      return res.status(403).json({ message: 'Not your task' });

    task.status = 'submitted';
    task.submittedAt = new Date();
    await task.save();

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to submit task:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.rejectTask = async (req, res) => {
  try {
    const { reason } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!task.assignedTo.equals(req.session.userId))
      return res.status(403).json({ message: 'Not your task' });

    task.status = 'rejected';
    task.reason = reason;
    await task.save();

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to reject task:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
