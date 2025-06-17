const User = require('../models/User');

exports.requireLogin = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ message: 'Invalid user' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Auth error' });
  }
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
