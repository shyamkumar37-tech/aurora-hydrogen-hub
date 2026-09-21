const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, 
    required: function() { 
      return !this.googleId; 
    } 
  },
  googleId: { type: String, sparse: true },
  avatar: { type: String },
  role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
  loyaltyPoints: { type: Number, default: 0 },
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
  walletBalance: { type: Number, default: 0 },
  isSuspended: { type: Boolean, default: false },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  phone: { type: String, default: '' },
  isProfileComplete: { type: Boolean, default: false },
  monthlySpendingCap: { type: Number, default: 15000 },
  digitalPassToken: { type: String },
  digitalPassExpiresAt: { type: Date },
  passkeys: [{
    credentialId: { type: String, required: true },
    publicKey: { type: String },
    counter: { type: Number, default: 0 },
    deviceName: { type: String, default: 'Biometric Fingerprint Sensor' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.password || !this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
