import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    city: { type: String, required: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    interests: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    otpHash: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    lastOtpSent: { type: Date, default: null }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
