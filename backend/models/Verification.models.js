import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    faceioId: {
      type: String,
      required: [true, 'FaceIO identifier is required']
    },
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Verification = mongoose.model('Verification', verificationSchema);
export default Verification;
