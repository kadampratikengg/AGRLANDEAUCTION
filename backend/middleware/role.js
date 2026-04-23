const roleMiddleware = (requiredRole) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userRole = req.user.role;

  if (!userRole) {
    return res.status(403).json({ message: 'Role not present in token' });
  }

  // Allow admin to pass all checks
  if (userRole === 'admin') return next();

  // For subuser checks, match exact requiredRole
  if (requiredRole === 'subuser' && userRole === 'subuser') return next();

  return res
    .status(403)
    .json({ message: 'Access denied: insufficient permissions' });
};

module.exports = { roleMiddleware };
