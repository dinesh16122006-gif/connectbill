const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { sendOtp, verifyOtp } = require('../services/otpService');

const jwtSecret = process.env.JWT_SECRET || 'connectbill_super_secret_jwt_key_2026_production';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
};

// Admin Login with Email/Phone + Password
const adminLogin = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/phone and password.'
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { phone: cleanIdentifier }],
      role: 'ADMIN'
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Admin account not found.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Admin account is inactive. Please contact system administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check and try again.'
      });
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email
    });

    return res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Customer Send OTP
const customerSendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required.'
      });
    }

    const sanitizedPhone = phone.replace(/\D/g, '').slice(-10);
    if (sanitizedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.'
      });
    }

    // Verify if customer exists in the system
    const customer = await Customer.findOne({ phone: sanitizedPhone });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'No connection found with this mobile number. Please check your number or contact your local cable/internet operator.'
      });
    }

    if (customer.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your customer account is currently inactive. Please contact support.'
      });
    }

    const otpResult = await sendOtp(sanitizedPhone);

    return res.status(200).json({
      success: true,
      message: otpResult.message,
      phone: sanitizedPhone,
      customerName: customer.name,
      devOtp: otpResult.devOtp
    });
  } catch (error) {
    next(error);
  }
};

// Customer Verify OTP & Login
const customerVerifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are both required.'
      });
    }

    const sanitizedPhone = phone.replace(/\D/g, '').slice(-10);
    const verification = await verifyOtp(sanitizedPhone, otp);

    if (!verification.isValid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Find customer profile
    const customer = await Customer.findOne({ phone: sanitizedPhone })
      .populate('providerId')
      .populate('planId');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer record not found.'
      });
    }

    // Find or create associated User record
    let user = await User.findOne({ phone: sanitizedPhone, role: 'CUSTOMER' });
    if (!user) {
      user = await User.create({
        name: customer.name,
        phone: sanitizedPhone,
        email: customer.email || undefined,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      });
    }

    if (!customer.userId) {
      customer.userId = user._id;
      await customer.save();
    }

    const token = generateToken({
      id: user._id,
      customerId: customer._id,
      role: 'CUSTOMER',
      name: customer.name,
      phone: customer.phone,
      connectionId: customer.connectionId
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Welcome back!',
      token,
      customer: {
        id: customer._id,
        userId: user._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        connectionId: customer.connectionId,
        address: customer.address,
        area: customer.area,
        provider: customer.providerId ? {
          id: customer.providerId._id,
          name: customer.providerId.name,
          code: customer.providerId.code
        } : null,
        plan: customer.planId ? {
          id: customer.planId._id,
          name: customer.planId.name,
          speed: customer.planId.speed,
          monthlyPrice: customer.planId.monthlyPrice
        } : null,
        monthlyAmount: customer.monthlyAmount,
        dueDay: customer.dueDay,
        status: customer.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current session user info
const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    let customerData = null;
    if (req.user.role === 'CUSTOMER') {
      customerData = await Customer.findOne({
        $or: [{ userId: req.user._id }, { phone: req.user.phone }]
      })
        .populate('providerId')
        .populate('planId');
    }

    return res.status(200).json({
      success: true,
      user: req.user,
      customer: customerData
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

module.exports = {
  adminLogin,
  customerSendOtp,
  customerVerifyOtp,
  getMe,
  logout
};
