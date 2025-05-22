import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    bio: {
      type: String,
      default: '',
      trim: true
    },
    avatar: {
      type: String,          // Cloudinary URL
      default: ''
    },
    interests: {
      type: [String],        // e.g. ["trekking","art"]
      default: []
    },
    isVerified: {
      type: Boolean,
      default: false        // updated after FaceIO flow
    }
  },
  {
    timestamps: true        // adds createdAt, updatedAt
  }
);

const User = mongoose.model('User', userSchema);
export default User;
