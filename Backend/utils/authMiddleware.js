const User = require('../models/User');

exports.requireLogin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  next();
};

exports.requireAdmin = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  const user = await User.findById(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: 'Admin only' });
  }

  req.user = user; // Attach user info to the request
  next();
};
