const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: 'ConnectBill Cable & Internet Services'
    },
    businessLogo: {
      type: String,
      default: ''
    },
    businessAddress: {
      type: String,
      default: '124 Telecom Lane, Main Market, Tech City, 560001'
    },
    phone: {
      type: String,
      default: '+91 98765 43210'
    },
    email: {
      type: String,
      default: 'support@connectbill.com'
    },
    upiId: {
      type: String,
      default: 'connectbill@okhdfcbank'
    },
    invoicePrefix: {
      type: String,
      default: 'CB'
    },
    defaultDueDay: {
      type: Number,
      default: 10
    },
    lateFeeAmount: {
      type: Number,
      default: 50
    },
    workingHours: {
      type: String,
      default: '9:00 AM - 8:00 PM (Mon - Sat)'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
