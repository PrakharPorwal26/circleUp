import Event from '../models/Event.models.js';
import Group from '../models/Group.models.js';

// Create Event under a group (Admins/Owners only)
export const createEvent = async (req, res, next) => {
  try {
    const { title, description, location, dateTime } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Only owner or admin can create events
    const member = group.members.find(m => m.user.toString() === req.userId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const event = await Event.create({
      groupId: req.params.groupId,
      title,
      description,
      location,
      dateTime,
      createdBy: req.userId
    });

    group.events.push(event._id);
    await group.save();

    res.status(201).json({ data: event });
  } catch (err) {
    next(err);
  }
};

// Fetch all events for a group
export const getGroupEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ groupId: req.params.groupId });
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
};

// Get single event details
export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('rsvps', 'name email avatar')
      .populate('interested', 'name email avatar');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ data: event });
  } catch (err) {
    next(err);
  }
};

// Update an event (Admins or event creator)
export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check permission: group admin or creator
    const group = await Group.findById(event.groupId);
    const member = group.members.find(m => m.user.toString() === req.userId);
    const isCreator = event.createdBy.toString() === req.userId;
    if (!member || (member.role !== 'owner' && member.role !== 'admin' && !isCreator)) {
      return res.status(403).json({ message: 'Forbidden: Cannot update event' });
    }

    const updates = {};
    ['title', 'description', 'location', 'dateTime'].forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

// Delete an event (Admins or event creator)
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check permission
    const group = await Group.findById(event.groupId);
    const member = group.members.find(m => m.user.toString() === req.userId);
    const isCreator = event.createdBy.toString() === req.userId;
    if (!member || (member.role !== 'owner' && member.role !== 'admin' && !isCreator)) {
      return res.status(403).json({ message: 'Forbidden: Cannot delete event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};

// RSVP to an event
export const rsvpEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.rsvps.includes(req.userId)) {
      return res.status(400).json({ message: 'Already RSVPed' });
    }

    event.rsvps.push(req.userId);
    await event.save();
    res.json({ message: 'RSVP successful' });
  } catch (err) {
    next(err);
  }
};

// Un-RSVP
export const unRsvpEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.rsvps = event.rsvps.filter(u => u.toString() !== req.userId);
    await event.save();
    res.json({ message: 'RSVP removed' });
  } catch (err) {
    next(err);
  }
};

// Mark interested in an event
export const interestEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.interested.includes(req.userId)) {
      return res.status(400).json({ message: 'Already marked interested' });
    }

    event.interested.push(req.userId);
    await event.save();
    res.json({ message: 'Marked as interested' });
  } catch (err) {
    next(err);
  }
};

// Unmark interested
export const uninterestEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.interested = event.interested.filter(u => u.toString() !== req.userId);
    await event.save();
    res.json({ message: 'Interest removed' });
  } catch (err) {
    next(err);
  }
};

// Upload past event photos (Members only)
export const uploadEventPhotos = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Only group members can upload
    const group = await Group.findById(event.groupId);
    if (!group.members.some(m => m.user.toString() === req.userId)) {
      return res.status(403).json({ message: 'Forbidden: Members only' });
    }

    req.files.forEach(f => event.pastEventPhotos.push(f.path));
    await event.save();
    res.json({ message: 'Photos uploaded', photos: event.pastEventPhotos });
  } catch (err) {
    next(err);
  }
};

// Get past event photos
export const getEventPhotos = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ data: event.pastEventPhotos });
  } catch (err) {
    next(err);
  }
};