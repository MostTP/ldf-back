import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
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
  currency: {
    type: String,
    default: 'NGN',
  },
  bankName: {
    type: String,
    default: null,
  },
  bankAccount: {
    type: String,
    default: null,
  },
  accountName: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    default: 'PENDING',
    enum: ['PENDING', 'APPROVED', 'PAID', 'FAILED'],
    index: true,
  },
  paymentReference: {
    type: String,
    default: null,
  },
  processedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
withdrawalSchema.index({ userId: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;

