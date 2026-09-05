const express = require('express');
const router = express.Router();
const {
  adminLogin,
  customerSendOtp,
  customerVerifyOtp,
  getMe,
  logout
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/admin/login', adminLogin);
router.post('/customer/send-otp', customerSendOtp);
router.post('/customer/verify-otp', customerVerifyOtp);
router.get('/me', verifyToken, getMe);
router.post('/logout', logout);

module.exports = router;
