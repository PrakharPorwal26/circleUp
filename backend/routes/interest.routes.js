import express from 'express';
import { getAllInterests, getCustomInterests } from '../controllers/Interest.controllers.js';

const router = express.Router();

router.get('/', getAllInterests);
router.get('/custom', getCustomInterests); 

export default router;
