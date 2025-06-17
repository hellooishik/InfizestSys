const PublicTask = require('../models/PublicTask');
const TaskRequest = require('../models/TaskRequest');
const Task = require('../models/Task');

// ✅ 1. Create a new public task (Admin)
exports.createPublicTask = async (req, res) => {
  try {
    const { taskId, topic, wordCount, estimatedQuote } = req.body;
    const documentPath = req.file?.path || '';

    if (!taskId || !topic || !wordCount || !estimatedQuote) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const duplicate = await PublicTask.findOne({ taskId });
    if (duplicate) {
      return res.status(409).json({ message: 'Task ID already exists' });
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

// ✅ 2. Get all public tasks (Visible on homepage)
exports.getAllPublicTasks = async (req, res) => {
  try {
    const tasks = await PublicTask.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    console.error('❌ Error in getAllPublicTasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// ✅ 3. Request to do a task (User)
exports.requestToDo = async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    // Find the actual PublicTask by `taskId` (string)
    const task = await PublicTask.findOne({ taskId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found with ID: ' + taskId });
    }

    // Check if user already requested this task
    const existing = await TaskRequest.findOne({ userId: req.user._id, taskId: task._id });
    if (existing) {
      return res.status(409).json({ message: 'You have already requested this task.' });
    }

    // Create new request
    const newRequest = new TaskRequest({
      userId: req.user._id,
      taskId: task._id,
      status: 'Pending',
      requestedAt: new Date()
    });

    await newRequest.save();

    res.status(201).json({ message: '✅ Task requested successfully', request: newRequest });

  } catch (err) {
    console.error('❌ Error in requestToDo:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// ✅ 4. Approve task request and assign it (Admin)
exports.approveTaskRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await TaskRequest.findById(requestId).populate('taskId');
    if (!request) {
      return res.status(404).json({ error: 'Task request not found' });
    }

    if (request.status === 'Approved') {
      return res.status(400).json({ message: 'Already approved' });
    }

    request.status = 'Approved';
    await request.save();

    // Create official Task entry
    await Task.create({
      jobId: request.taskId.taskId,
      deadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // ⏳ 3 days
      googleDocsLink: '',
      assignedTo: request.userId,
      status: 'pending'
    });

    res.status(200).json({ message: '✅ Task approved and assigned', request });

  } catch (err) {
    console.error('❌ Error in approveTaskRequest:', err);
    res.status(500).json({ error: 'Approval failed', details: err.message });
  }
};
exports.updatePublicTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, wordCount, estimatedQuote } = req.body;

    const updated = await PublicTask.findByIdAndUpdate(id, {
      topic,
      wordCount,
      estimatedQuote
    }, { new: true });

    if (!updated) return res.status(404).json({ message: 'Task not found' });

    res.status(200).json({ message: 'Task updated', task: updated });
  } catch (err) {
    console.error('❌ Failed to update task:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
exports.deletePublicTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PublicTask.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Task not found' });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
