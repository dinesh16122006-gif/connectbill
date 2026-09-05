const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getCollectionsReport,
  getProviderWiseReport
} = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard', verifyToken, requireAdmin, getDashboardMetrics);
router.get('/collections', verifyToken, requireAdmin, getCollectionsReport);
router.get('/providers', verifyToken, requireAdmin, getProviderWiseReport);

module.exports = router;
