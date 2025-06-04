const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deadline: { type: Date, required: true },
  files: [String], // URLs or filenames
  googleDocsLink: { type: String },
  status: {
    type: String,
    enum: ['assigned', 'working', 'submitted', 'rejected'],
    default: 'assigned'
  },
  reason: { type: String },
  submittedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
