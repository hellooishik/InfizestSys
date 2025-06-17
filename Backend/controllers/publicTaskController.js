const PublicTask = require('../models/PublicTask');
const TaskRequest = require('../models/TaskRequest');

exports.createPublicTask = async (req, res) => {
  try {
    const { taskId, topic, wordCount, estimatedQuote } = req.body;
    const documentPath = req.file?.path || '';

    if (!taskId || !topic || !wordCount || !estimatedQuote) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newTask = new PublicTask({
      taskId,
      topic,
      wordCount,
      estimatedQuote,
      documentPath
    });

    await newTask.save();

    res.status(201).json({ message: '✅ Public Task Created Successfully', task: newTask });
  } catch (err) {
    console.error('❌ Error in createPublicTask:', err);
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
};


exports.getAllPublicTasks = async (req, res) => {
  try {
    const tasks = await PublicTask.find();
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

exports.requestToDo = async (req, res) => {
  try {
    const { taskId } = req.body;
    const userId = req.session.userId;

    const alreadyRequested = await TaskRequest.findOne({ taskId, userId });
    if (alreadyRequested) {
      return res.status(400).json({ error: 'Already requested this task' });
    }

    const request = new TaskRequest({ taskId, userId });
    await request.save();

    res.status(200).json({ message: 'Task request submitted', request });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request task' });
  }
};

const Task = require('../models/Task'); // ⬅️ only if needed

exports.approveTaskRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await TaskRequest.findById(requestId).populate('taskId');
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = 'Approved';
    await request.save();

    // Optional: If you want it to appear in Assigned Tasks table:
    await Task.create({
      jobId: request.taskId.taskId,
      deadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // Example: 3-day deadline
      googleDocsLink: '',
      assignedTo: request.userId,
      status: 'pending'
    });

    res.status(200).json({ message: 'Task approved and assigned', request });
  } catch (err) {
    res.status(500).json({ error: 'Approval failed' });
  }
};

