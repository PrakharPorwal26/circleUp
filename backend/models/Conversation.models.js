import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: 'A conversation must have exactly 2 participants.'
      }
    },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index so we can quickly find a conversation by participants
conversationSchema.index({ participants: 1 }, { unique: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
