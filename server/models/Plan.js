const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    speed: {
      type: String,
      required: true,
      trim: true
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['FIBER', 'BROADBAND', 'CABLE_TV', 'COMBO'],
      default: 'FIBER'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
