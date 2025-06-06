import express from 'express';
import { protect } from '../middlewares/auth.middlewares.js';
import { recommendGroups, recommendUsers } from '../controllers/Recommend.controllers.js';

const router = express.Router();

router.get('/groups', protect, recommendGroups);
router.get('/users', protect, recommendUsers);

export default router;