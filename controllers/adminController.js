const User = require('../models/User');
const Log = require('../models/Log');
const { exportToCSV } = require('../utils/csvExport');
exports.addUser = async (req, res) => {
  const { name, email, loginId, password, isAdmin = false } = req.body;

  if (!name || !email || !loginId || !password) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }

  const exists = await User.findOne({ loginId });
  if (exists) return res.status(409).json({ message: 'Login ID already exists' });

  const newUser = new User({
    name,
    email,
    loginId,
    password,
    isAdmin,
    monthlyPaymentPending: 0,
    monthlyPaymentReceived: 0,
    breakTimeToday: 0
  });

  await newUser.save();
  res.json({ success: true, user: newUser });
};
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

