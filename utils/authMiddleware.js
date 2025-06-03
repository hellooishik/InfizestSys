exports.requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  if (!req.session.isAdmin) return res.status(403).json({ message: 'Admin only' });
  next();
};
