import express from 'express';
import { protect } from '../middlewares/auth.middlewares.js';
import { ensureGroupAdmin, ensureGroupMember } from '../middlewares/group.middlewares.js';
import * as groupCtrl from '../controllers/Group.controllers.js';
import { upload } from '../middlewares/multer.middlewares.js';

const router = express.Router();

// Creation & retrieval
router.post('/', protect, groupCtrl.createGroup);
router.get('/:id', protect, groupCtrl.getGroup);

// Admin routes
router.patch('/:id', protect, ensureGroupAdmin, groupCtrl.updateGroup);
router.patch('/:id/dp', protect, ensureGroupAdmin, upload.single('dp'), groupCtrl.uploadGroupDP);
router.post('/:id/invite', protect, ensureGroupAdmin, groupCtrl.inviteToGroup);
router.post('/:id/approve/:userId', protect, ensureGroupAdmin, groupCtrl.approveJoin);
router.post('/:id/kick/:userId', protect, ensureGroupAdmin, groupCtrl.kickMember);
router.post('/:id/promote/:userId', protect, ensureGroupAdmin, groupCtrl.promoteMember);
router.delete('/:id', protect, ensureGroupAdmin, groupCtrl.deleteGroup);
router.get('/:id/audit', protect, ensureGroupAdmin, groupCtrl.getAuditLog);

// Member routes
router.post('/:id/join', protect, groupCtrl.requestToJoin);
router.post('/:id/media', protect, ensureGroupMember, upload.array('media'), groupCtrl.uploadMedia);
router.get('/:id/media', protect, ensureGroupMember, groupCtrl.getMediaGallery);
router.get('/:id/notifications', protect, ensureGroupMember, groupCtrl.getNotifications);
router.patch('/:id/notifications/:notifId/read', protect, ensureGroupMember, groupCtrl.markNotificationRead);

export default router;
