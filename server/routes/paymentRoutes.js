const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  recordCashPayment,
  handleWebhook,
  getPayments,
  getReceipt
} = require('../controllers/paymentController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/create-order', verifyToken, createPaymentOrder);
router.post('/verify', verifyToken, verifyPayment);
router.post('/record-cash', verifyToken, requireAdmin, recordCashPayment);
router.post('/webhook', handleWebhook); // Public webhook for Razorpay
router.get('/', verifyToken, getPayments);
router.get('/receipt/:id', verifyToken, getReceipt);

module.exports = router;
