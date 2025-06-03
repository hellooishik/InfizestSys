const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  loginId: { type: String, unique: true },
  password: String,
  monthlyPaymentPending: { type: Number, default: 0 },
  monthlyPaymentReceived: { type: Number, default: 0 },
  breakTimeToday: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
