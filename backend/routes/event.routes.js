import express from 'express';
import { protect } from '../middlewares/auth.middlewares.js';
import * as eventCtrl from '../controllers/Event.controllers.js';
import { upload } from '../middlewares/multer.middlewares.js';

const router = express.Router();

// Group-based event endpoints
router.post('/groups/:groupId/events', protect, eventCtrl.createEvent);
router.get('/groups/:groupId/events', protect, eventCtrl.getGroupEvents);

// Event-specific endpoints
router.get('/events/:id', protect, eventCtrl.getEvent);
router.patch('/events/:id', protect, eventCtrl.updateEvent);
router.delete('/events/:id', protect, eventCtrl.deleteEvent);

// RSVP / Interested
router.post('/events/:id/rsvp', protect, eventCtrl.rsvpEvent);
router.post('/events/:id/unrsvp', protect, eventCtrl.unRsvpEvent);
router.post('/events/:id/interest', protect, eventCtrl.interestEvent);
router.post('/events/:id/uninterest', protect, eventCtrl.uninterestEvent);

// Past event photos
router.post('/events/:id/photos', protect, upload.array('photos'), eventCtrl.uploadEventPhotos);
router.get('/events/:id/photos', protect, eventCtrl.getEventPhotos);

export default router;
