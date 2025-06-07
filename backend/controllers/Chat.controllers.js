import Conversation from '../models/Conversation.models.js';
import Message from '../models/Message.models.js';
import GroupChat from '../models/GroupChat.models.js';
import GroupMessage from '../models/GroupMessage.models.js';
import Group from '../models/Group.models.js';
import { io } from '../index.js'; // import the Socket.io instance
import mongoose from 'mongoose';

// ─── Helper: Ensure two user IDs always sorted (to avoid duplicate conversations) ───
function sortPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

// ─── 1:1 Conversation Controllers ───────────────────────────────────────────────

// POST /api/v1/chats/private/:otherUserId
// Find or create a conversation between req.userId and otherUserId
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const otherUserId = req.params.otherUserId;
    const [id1, id2] = sortPair(userId, otherUserId);

    let conversation = await Conversation.findOne({
      participants: { $all: [id1, id2] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [id1, id2]
      });
    }

    res.json({ conversationId: conversation._id });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/chats/private/:conversationId/message
export const sendPrivateMessage = async (req, res, next) => {
  try {
    const userId = req.userId;
    const conversationId = req.params.conversationId;
    const { content, attachments } = req.body;

    // Check if conversation exists & user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (
      !conversation ||
      !conversation.participants.includes(req.userId)
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      content,
      attachments: attachments || []
    });

    // Update lastMessageAt on conversation
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit via socket.io to both participants
    io.to(`private_${conversationId}`).emit('newPrivateMessage', {
      _id: message._id,
      conversationId,
      sender: userId,
      content,
      attachments: message.attachments,
      createdAt: message.createdAt
    });

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/chats/private/:conversationId/messages?before=<timestamp>&limit=50
export const getPrivateMessages = async (req, res, next) => {
  try {
    const userId = req.userId;
    const conversationId = req.params.conversationId;
    const { before, limit = 50 } = req.query;

    // Check membership
    const conversation = await Conversation.findById(conversationId);
    if (
      !conversation ||
      !conversation.participants.includes(userId)
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Build query
    const query = { conversationId };
    if (before) {
      // `before` can be a date or messageId; here assume ISO date
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ data: messages });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/chats/private
// List all conversations for req.userId
export const listConversations = async (req, res, next) => {
  try {
    const userId = req.userId;
    const conversations = await Conversation.find({
      participants: userId
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    // Populate the “other participant” info, and the last message snippet
    const results = await Promise.all(
      conversations.map(async (conv) => {
        const otherId = conv.participants.find((id) => id.toString() !== userId);
        const messages = await Message.find({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean();
        const lastMsg = messages[0] || null;

        // Fetch other user’s name & avatar
        const otherUser = await mongoose.model('User').findById(otherId, 'name avatar').lean();

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: lastMsg
            ? { content: lastMsg.content, sender: lastMsg.sender, createdAt: lastMsg.createdAt }
            : null,
          updatedAt: conv.lastMessageAt
        };
      })
    );

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
};

// ─── Group Chat Controllers ───────────────────────────────────────────────────

// POST /api/v1/chats/group/:groupId/message
export const sendGroupMessage = async (req, res, next) => {
  try {
    const userId = req.userId;
    const groupId = req.params.groupId;
    const { content, attachments } = req.body;

    // Check that user is a member of group
    const group = await Group.findById(groupId).select('members');
    if (
      !group ||
      !group.members.some((m) => m.user.toString() === userId)
    ) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Find or create GroupChat
    let groupChat = await GroupChat.findOne({ groupId });
    if (!groupChat) {
      groupChat = await GroupChat.create({ groupId });
    }

    const message = await GroupMessage.create({
      chatId: groupChat._id,
      sender: userId,
      content,
      attachments: attachments || []
    });

    groupChat.lastMessageAt = new Date();
    await groupChat.save();

    // Broadcast to all sockets in room `group_<groupId>`
    io.to(`group_${groupId}`).emit('newGroupMessage', {
      _id: message._id,
      chatId: groupChat._id,
      sender: userId,
      content,
      attachments: message.attachments,
      createdAt: message.createdAt
    });

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/chats/group/:groupId/messages?before=<timestamp>&limit=50
export const getGroupMessages = async (req, res, next) => {
  try {
    const userId = req.userId;
    const groupId = req.params.groupId;
    const { before, limit = 50 } = req.query;

    const group = await Group.findById(groupId).select('members');
    if (
      !group ||
      !group.members.some((m) => m.user.toString() === userId)
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let groupChat = await GroupChat.findOne({ groupId });
    if (!groupChat) {
      return res.json({ data: [] }); // no chat messages yet
    }

    const query = { chatId: groupChat._id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await GroupMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ data: messages });
  } catch (err) {
    next(err);
  }
};
