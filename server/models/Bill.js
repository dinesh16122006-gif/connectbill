const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection'
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true
    },
    billNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    billingMonth: {
      type: String,
      required: true,
      index: true // Format: 'YYYY-MM', e.g., '2026-09'
    },
    billingMonthName: {
      type: String,
      required: true // e.g. 'September 2026'
    },
    billDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    previousPending: {
      type: Number,
      default: 0,
      min: 0
    },
    lateFee: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    notes: {
      type: String
    }
  },
  { timestamps: true }
);

// Prevent duplicate monthly bills for the same customer and billing month
billSchema.index({ customerId: 1, billingMonth: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);
