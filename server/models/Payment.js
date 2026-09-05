const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'ONLINE', 'BANK_TRANSFER'],
      required: true
    },
    gateway: {
      type: String,
      default: 'RAZORPAY'
    },
    gatewayOrderId: {
      type: String,
      trim: true
    },
    gatewayPaymentId: {
      type: String,
      trim: true
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED'],
      default: 'SUCCESS',
      index: true
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: String,
      enum: ['ADMIN', 'CUSTOMER_ONLINE'],
      default: 'CUSTOMER_ONLINE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
