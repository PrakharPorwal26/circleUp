import crypto from 'crypto';
import Group from '../models/Group.models.js';
import cloudinary from '../utils/cloudinary.js';
import { upload } from '../middlewares/multer.middlewares.js';
import Event from '../models/Event.models.js'; // Ensure Event model is registered

// Role hierarchy values
const roleHierarchy = { owner: 4, admin: 3, moderator: 2, member: 1 };

// Create Group
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, privacy, tags, location, capacity } = req.body;
    const group = await Group.create({
      name,
      description,
      privacy,
      tags,
      location,
      capacity,
      members: [{ user: req.userId, role: 'owner' }]
    });
    res.status(201).json({ data: group });
  } catch (err) {
    next(err);
  }
};

// Get Group
export const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('joinRequests.user', 'name email avatar')
      .populate('events');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ data: group });
  } catch (err) {
    next(err);
  }
};

// Update Group Metadata
export const updateGroup = async (req, res, next) => {
  try {
    const updates = {};
    ['description', 'dp', 'privacy', 'tags', 'location', 'capacity', 'pinnedPost'].forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json({ data: group });
  } catch (err) {
    next(err);
  }
};

// Upload Group Display Picture
export const uploadGroupDP = async (req, res, next) => {
  try {
    const group = req.group;
    const url = req.file.path;
    group.dp = url;
    group.auditLog.push({ action: 'update_dp', performedBy: req.userId, metadata: { url } });
    await group.save();
    res.json({ message: 'DP updated', dp: url });
  } catch (err) {
    next(err);
  }
};

// Generate Invite Code
export const inviteToGroup = async (req, res, next) => {
  try {
    const group = req.group;
    const code = crypto.randomBytes(6).toString('hex');
    group.inviteCodes.push({ code, createdAt: new Date(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    group.auditLog.push({ action: 'generate_invite', performedBy: req.userId, metadata: { code } });
    await group.save();
    res.json({ data: { inviteCode: code } });
  } catch (err) {
    next(err);
  }
};

// Request to Join
export const requestToJoin = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Prevent existing members from requesting
    if (group.members.some(m => m.user.toString() === req.userId)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Prevent duplicate requests
    if (group.joinRequests.some(r => r.user.toString() === req.userId)) {
      return res.status(400).json({ message: 'Your join request is already pending' });
    }

    // Queue or auto-join
    if (group.privacy !== 'public') {
      group.joinRequests.push({ user: req.userId });
      group.auditLog.push({ action: 'request_join', performedBy: req.userId });
      await group.save();
      return res.json({ message: 'Join request submitted' });
    }

    group.members.push({ user: req.userId, role: 'member' });
    group.auditLog.push({ action: 'join', performedBy: req.userId });
    await group.save();
    res.json({ message: 'Joined group' });
  } catch (err) {
    next(err);
  }
};

// Approve Join Request
export const approveJoin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const group = req.group;
    const kicker = group.members.find(m => m.user.toString() === req.userId);

    // Only allow admin+ to approve
    if (roleHierarchy[kicker.role] < roleHierarchy.admin) {
      return res.status(403).json({ message: 'Forbidden: Requires admin or owner to approve' });
    }

    // Check if already a member
    if (group.members.some(m => m.user.toString() === userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Remove from pending requests
    group.joinRequests = group.joinRequests.filter(r => r.user.toString() !== userId);
    // Add to members
    group.members.push({ user: userId, role: 'member' });
    group.auditLog.push({ action: 'approve_join', performedBy: req.userId, metadata: { userId } });
    await group.save();
    res.json({ message: 'User approved' });
  } catch (err) {
    next(err);
  }
};

// Kick Member
export const kickMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const group = req.group;
    const kicker = group.members.find(m => m.user.toString() === req.userId);
    const toKick = group.members.find(m => m.user.toString() === userId);

    if (!toKick) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const kickerRank = roleHierarchy[kicker.role] || 0;
    const targetRank = roleHierarchy[toKick.role] || 0;

    // Cannot kick same or higher role
    if (kickerRank <= targetRank) {
      return res.status(403).json({ message: `Forbidden: Cannot remove a ${toKick.role}` });
    }

    // Remove member
    group.members = group.members.filter(m => m.user.toString() !== userId);
    group.auditLog.push({ action: 'kick_member', performedBy: req.userId, metadata: { userId } });
    await group.save();
    res.json({ message: 'Member kicked' });
  } catch (err) {
    next(err);
  }
};

// Promote Member
export const promoteMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const group = req.group;
    const kicker = group.members.find(m => m.user.toString() === req.userId);
    const member = group.members.find(m => m.user.toString() === userId);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const kickerRank = roleHierarchy[kicker.role] || 0;
    const targetRank = roleHierarchy[member.role] || 0;

    // Only higher rank can promote
    if (kickerRank <= targetRank) {
      return res.status(403).json({ message: `Forbidden: Cannot promote a ${member.role}` });
    }

    // Promote
    member.role = 'admin';
    group.auditLog.push({ action: 'promote_member', performedBy: req.userId, metadata: { userId } });
    await group.save();
    res.json({ message: 'Member promoted' });
  } catch (err) {
    next(err);
  }
};

// Delete Group
export const deleteGroup = async (req, res, next) => {
  try {
    await Group.findByIdAndDelete(req.params.id);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
};

// Upload Media to Gallery
export const uploadMedia = async (req, res, next) => {
  try {
    const group = req.group;
    req.files.forEach(f => {
      group.mediaGallery.push({ url: f.path, uploadedBy: req.userId });
      group.auditLog.push({ action: 'upload_media', performedBy: req.userId, metadata: { url: f.path } });
    });
    await group.save();
    res.json({ message: 'Media uploaded', media: group.mediaGallery });
  } catch (err) {
    next(err);
  }
};

// Get Media Gallery
export const getMediaGallery = async (req, res, next) => {
  try {
    res.json({ data: req.group.mediaGallery });
  } catch (err) {
    next(err);
  }
};

// Get Notifications
export const getNotifications = async (req, res, next) => {
  try {
    res.json({ data: req.group.notifications });
  } catch (err) {
    next(err);
  }
};

// Mark Notification Read
export const markNotificationRead = async (req, res, next) => {
  try {
    const { notifId } = req.params;
    const group = req.group;
    const notif = group.notifications.id(notifId);

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notif.read = true;
    await group.save();
    res.json({ message: 'Notification marked read' });
  } catch (err) {
    next(err);
  }
};

// Get Audit Log
export const getAuditLog = async (req, res, next) => {
  try {
    res.json({ data: req.group.auditLog });
  } catch (err) {
    next(err);
  }
};
