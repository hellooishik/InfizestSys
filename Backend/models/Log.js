const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    enum: ['running', 'paused', 'auto-paused', 'ended'],
    default: 'running'
  },
  breakTime: { type: Number, default: 0 },
  breakCount: { type: Number, default: 0 },
  approveness: {
    type: String,
    enum: ['None', 'Pending', 'Approved', 'Denied'], // ✅ 'None' added
    default: 'None'
  },
  logDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Log', LogSchema);
