import mongoose from 'mongoose';

const groupChatSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      unique: true
    },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Each group has exactly one chat document
const GroupChat = mongoose.model('GroupChat', groupChatSchema);
export default GroupChat;
