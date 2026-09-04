const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const pool = require('../config/database');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is disabled' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get roles and permissions
    const roles = await User.getRoles(user.id);
    const permissions = await User.getPermissions(user.id);

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        roles: roles.map(r => r.name),
        permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'LOGIN', JSON.stringify({ success: true }), req.ip, req.headers['user-agent']]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        roles: roles.map(r => r.name),
        permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roles = await User.getRoles(user.id);
    const permissions = await User.getPermissions(user.id);

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      roles: roles.map(r => r.name),
      permissions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, 'LOGOUT', JSON.stringify({}), req.ip, req.headers['user-agent']]
    );
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};