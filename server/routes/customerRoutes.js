const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerProfile
} = require('../controllers/customerController');
const { verifyToken, requireAdmin, requireCustomer } = require('../middleware/authMiddleware');

// Customer self profile
router.get('/profile', verifyToken, requireCustomer, getCustomerProfile);

// Admin customer management
router.get('/', verifyToken, requireAdmin, getCustomers);
router.post('/', verifyToken, requireAdmin, createCustomer);
router.get('/:id', verifyToken, requireAdmin, getCustomerById);
router.put('/:id', verifyToken, requireAdmin, updateCustomer);
router.delete('/:id', verifyToken, requireAdmin, deleteCustomer);

module.exports = router;
