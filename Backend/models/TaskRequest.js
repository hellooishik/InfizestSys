const mongoose = require('mongoose');

const taskRequestSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  requestedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TaskRequest', taskRequestSchema);
