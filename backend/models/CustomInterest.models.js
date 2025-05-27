import mongoose from 'mongoose';

const customInterestSchema = new mongoose.Schema(
  {
    interest: { type: String, required: true, lowercase: true, trim: true, unique: true },
    submittedBy: [{ type: String }], // emails of users who submitted it
    count: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export default mongoose.model('CustomInterest', customInterestSchema);
