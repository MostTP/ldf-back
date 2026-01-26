import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  usedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Only createdAt
});

// Indexes
// Note: code already has an index from unique: true
couponSchema.index({ agentId: 1 });
couponSchema.index({ isUsed: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;

