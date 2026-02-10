import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

earningSchema.index({ userId: 1 });
earningSchema.index({ type: 1 });
earningSchema.index({ createdAt: -1 });

const Earning = mongoose.model('Earning', earningSchema);

export default Earning;

