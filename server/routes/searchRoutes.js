const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireAdmin, globalSearch);

module.exports = router;
