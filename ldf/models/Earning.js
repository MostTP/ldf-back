import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    required: true,
    index: true,
    // REFERRAL_BONUS, MATRIX_LEVEL_1-5, GLOBAL_POOL_ROI, PREMIUM_ROI, DETTY_DECEMBER, etc.
  },
  description: {
    type: String,
    default: null,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Only createdAt
});

// Indexes
earningSchema.index({ userId: 1 });
earningSchema.index({ type: 1 });
earningSchema.index({ createdAt: -1 });

const Earning = mongoose.model('Earning', earningSchema);

export default Earning;

