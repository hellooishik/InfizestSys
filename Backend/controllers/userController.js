const User = require('../models/User');

exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.session.userId).select('-password');
  res.json(user);
};

exports.updateUserProfile = async (req, res) => {
  const updates = req.body;
  await User.findByIdAndUpdate(req.session.userId, updates);
  res.json({ success: true });
};
