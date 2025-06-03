const User = require('../models/User');

exports.login = async (req, res) => {
  const { loginId, password } = req.body;
  const user = await User.findOne({ loginId });
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid login credentials' });
  }
  req.session.userId = user._id;
  res.json({ success: true });
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
};

exports.sessionInfo = async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = await User.findById(req.session.userId).select('-password');
  res.json({ user });
};
