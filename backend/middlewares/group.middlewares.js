import Group from '../models/Group.models.js';

export const ensureGroupAdmin = async (req, res, next) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  const member = group.members.find(m => m.user.toString() === req.userId);
  if (!member || !['owner','admin'].includes(member.role)) {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  req.group = group;
  next();
};

export const ensureGroupMember = async (req, res, next) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  const isMember = group.members.some(m => m.user.toString() === req.userId);
  if (!isMember) return res.status(403).json({ message: 'Forbidden: Members only' });
  req.group = group;
  next();
};