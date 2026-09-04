const express = require('express');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getAuditLogs,
} = require('../controllers/userController');
const { verifyToken, requirePermission } = require('../middlewares/rbac');
const router = express.Router();

router.get('/', verifyToken, requirePermission('manage_users'), getAllUsers);
router.post('/', verifyToken, requirePermission('manage_users'), createUser);
router.put('/:id', verifyToken, requirePermission('manage_users'), updateUser);
router.delete('/:id', verifyToken, requirePermission('manage_users'), deleteUser);
router.get('/roles', verifyToken, requirePermission('manage_roles'), getRoles);
router.get('/audit-logs', verifyToken, requirePermission('view_audit_logs'), getAuditLogs);

module.exports = router;