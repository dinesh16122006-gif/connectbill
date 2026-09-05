const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');

const jwtSecret = process.env.JWT_SECRET || 'connectbill_super_secret_jwt_key_2026_production';

// Verify any valid JWT (Admin or Customer)
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    req.user = user;

    if (user.role === 'CUSTOMER') {
      let customer = await Customer.findOne({ userId: user._id })
        .populate('providerId')
        .populate('planId');

      if (!customer && user.phone) {
        customer = await Customer.findOne({ phone: user.phone })
          .populate('providerId')
          .populate('planId');
      }

      req.customer = customer;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

// Require ADMIN role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Admin privileges required.'
    });
  }
  next();
};

// Require CUSTOMER role and bind customer document to req.customer
const requireCustomer = async (req, res, next) => {
  if (!req.user || req.user.role !== 'CUSTOMER') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Customer privileges required.'
    });
  }

  try {
    // Find customer by userId or phone
    let customer = await Customer.findOne({ userId: req.user._id })
      .populate('providerId')
      .populate('planId');

    if (!customer && req.user.phone) {
      customer = await Customer.findOne({ phone: req.user.phone })
        .populate('providerId')
        .populate('planId');
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer record not found for this account.'
      });
    }

    req.customer = customer;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error resolving customer profile.'
    });
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireCustomer
};
