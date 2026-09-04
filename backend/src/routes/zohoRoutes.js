const express = require('express');
const { getAuthorizedApps, proxyRequest } = require('../controllers/zohoController');
const { verifyToken } = require('../middlewares/rbac');
const router = express.Router();

router.get('/apps', verifyToken, getAuthorizedApps);
router.all('/proxy/:app/:endpoint*', verifyToken, proxyRequest);

module.exports = router;