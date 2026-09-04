const bcrypt = require('bcryptjs');
const User = require('../models/User');
const pool = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  const { email, password, full_name, roleIds } = req.body;

  try {
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      full_name,
    });

    // Assign roles
    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        await User.assignRole(user.id, roleId);
      }
    }

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, 'CREATE_USER', JSON.stringify({ email }), req.ip, req.headers['user-agent']]
    );

    res.status(201).json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, is_active, roleIds } = req.body;

  try {
    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      query += `, full_name = $${paramIndex}`;
      params.push(full_name);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += `, is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update roles if provided
    if (roleIds) {
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      for (const roleId of roleIds) {
        await User.assignRole(id, roleId);
      }
    }

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, 'UPDATE_USER', JSON.stringify({ userId: id }), req.ip, req.headers['user-agent']]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, 'DELETE_USER', JSON.stringify({ userId: id }), req.ip, req.headers['user-agent']]
    );

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAuditLogs = async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `SELECT al.*, u.email, u.full_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};