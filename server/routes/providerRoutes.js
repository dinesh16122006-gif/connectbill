const express = require('express');
const router = express.Router();
const {
  getProviders,
  createProvider,
  updateProvider
} = require('../controllers/providerController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getProviders);
router.post('/', verifyToken, requireAdmin, createProvider);
router.put('/:id', verifyToken, requireAdmin, updateProvider);

module.exports = router;
