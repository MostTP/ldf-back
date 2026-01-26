import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 6,
    maxlength: 15,
    index: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    default: null,
  },
  bankAccount: {
    type: String,
    default: null,
  },
  // Referral/Sponsor system
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  // Activation & Status
  couponCode: {
    type: String,
    default: null,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
    index: true,
  },
  emailVerificationTokenExpiry: {
    type: Date,
    default: null,
  },
  isAgent: {
    type: Boolean,
    default: false,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  kycVerified: {
    type: Boolean,
    default: false,
  },
  // Agent system
  agentCouponCredits: {
    type: Number,
    default: 0,
  },
  // Terms & Agreements
  termsAccepted: {
    type: Boolean,
    default: false,
  },
  riskDisclosureAccepted: {
    type: Boolean,
    default: false,
  },
  couponAcknowledged: {
    type: Boolean,
    default: false,
  },
  // Balance
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ sponsorId: 1 });
userSchema.index({ emailVerificationToken: 1 });

const User = mongoose.model('User', userSchema);

export default User;

