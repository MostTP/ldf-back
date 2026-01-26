import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema({
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
  tier: {
    type: String,
    required: true,
    // PREMIUM, CAPITAL_POOL, etc.
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'completed', 'failed'],
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
investmentSchema.index({ userId: 1 });
investmentSchema.index({ status: 1 });
investmentSchema.index({ paymentReference: 1 });

const Investment = mongoose.model('Investment', investmentSchema);

export default Investment;

