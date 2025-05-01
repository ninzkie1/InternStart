const mongoose = require('mongoose');
const crypto = require('crypto');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  inviteCode: {
    type: String,
    unique: true,
  },
  inviteCodeExpires: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate new invite code only if one doesn't exist or has expired
organizationSchema.methods.generateInviteCode = function() {
  this.inviteCode = crypto.randomBytes(4).toString('hex');
  this.inviteCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
};

// Ensure inviteCode is set before saving only if it doesn't exist
organizationSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.generateInviteCode();
  }
  next();
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization; 