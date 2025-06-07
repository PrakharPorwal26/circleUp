import express from 'express';
import {
  getOrCreateConversation,
  sendPrivateMessage,
  getPrivateMessages,
  listConversations,
  sendGroupMessage,
  getGroupMessages
} from '../controllers/Chat.controllers.js';
import { protect } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// ─── Private Chat ─────────────────────────────────────────────
router.post(
  '/private/:otherUserId',
  protect,
  getOrCreateConversation
);
router.get(
  '/private',
  protect,
  listConversations
);
router.get(
  '/private/:conversationId/messages',
  protect,
  getPrivateMessages
);
router.post(
  '/private/:conversationId/message',
  protect,
  sendPrivateMessage
);

// ─── Group Chat ───────────────────────────────────────────────
router.get(
  '/group/:groupId/messages',
  protect,
  getGroupMessages
);
router.post(
  '/group/:groupId/message',
  protect,
  sendGroupMessage
);

export default router;
