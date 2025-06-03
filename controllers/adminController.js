const User = require('../models/User');
const Log = require('../models/Log');
const { exportToCSV } = require('../utils/csvExport');

exports.listUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.updateUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
};

exports.approveUser = async (req, res) => {
  const today = new Date().setHours(0,0,0,0);
  await Log.updateOne({ userId: req.params.id, logDate: today }, {
    approveness: 'Approved',
    status: 'running'
  });
  res.json({ success: true });
};

exports.denyUser = async (req, res) => {
  const today = new Date().setHours(0,0,0,0);
  await Log.updateOne({ userId: req.params.id, logDate: today }, {
    approveness: 'Denied'
  });
  res.json({ success: true });
};

exports.exportCSV = async (req, res) => {
  const logs = await Log.find().populate('userId');
  exportToCSV(logs, res);
};
