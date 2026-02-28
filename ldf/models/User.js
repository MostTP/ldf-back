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
  },
  /** Position (0-3904) in sponsor's matrix. Set at activation for spillover (6th+ direct ref); ensures first-available, first-come-first-serve, spillover never moves. */
  matrixPositionInSponsor: {
    type: Number,
    default: null,
    min: 0,
    max: 3904,
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
  // Pending balance (requires 2 direct referrals to unlock)
  pendingBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Subscription status
  isActive: {
    type: Boolean,
    default: true,
  },
  subscriptionExpiresAt: {
    type: Date,
    default: null,
  },
  // Matrix placement lock (for concurrency)
  matrixPlacementLock: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes
// Note: email and username already have indexes from unique: true
userSchema.index({ sponsorId: 1 });
userSchema.index({ sponsorId: 1, matrixPositionInSponsor: 1 }, { unique: true, sparse: true });
userSchema.index({ matrixPositionInSponsor: 1 }, { sparse: true });
userSchema.index({ emailVerificationToken: 1 });

const User = mongoose.model('User', userSchema);

export default User;

