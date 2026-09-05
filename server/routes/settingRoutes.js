const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', getSettings); // Public to load company header/name on receipts & landing
router.put('/', verifyToken, requireAdmin, updateSettings);

module.exports = router;
