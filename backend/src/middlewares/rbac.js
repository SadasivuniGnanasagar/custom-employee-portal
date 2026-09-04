const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Fetch permissions from DB
    const permissions = await User.getPermissions(decoded.userId);
    req.user.permissions = permissions;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ message: 'Access Denied' });
    }

    if (req.user.permissions.includes(permission)) {
      next();
    } else {
      return res.status(403).json({
        message: `Access Denied: ${permission} required`
      });
    }
  };
};

const verifyRole = (allowedRoles) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user roles from DB
      const roles = await User.getRoles(decoded.userId);
      const roleNames = roles.map(r => r.name);

      if (!allowedRoles.some(role => roleNames.includes(role))) {
        return res.status(403).json({
          message: 'Access Denied: Insufficient Permissions'
        });
      }

      req.user = decoded;
      req.user.roles = roleNames;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid Token' });
    }
  };
};

module.exports = { verifyToken, requirePermission, verifyRole };