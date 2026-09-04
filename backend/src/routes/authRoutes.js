const express = require('express');
const { login, me, logout } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/rbac');
const router = express.Router();

router.post('/login', login);
router.get('/me', verifyToken, me);
router.post('/logout', verifyToken, logout);

module.exports = router;