const express = require('express');
const router = express.Router();
const {
  getConnections,
  updateConnectionStatus
} = require('../controllers/connectionController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireAdmin, getConnections);
router.put('/:id/status', verifyToken, requireAdmin, updateConnectionStatus);

module.exports = router;
