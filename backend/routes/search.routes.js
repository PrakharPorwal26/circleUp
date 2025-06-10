import express from 'express';
import { searchGroups } from '../controllers/Search.controllers.js';

const router = express.Router();

/**
 * @route GET /api/v1/search/groups
 * @query  q       (optional) free‐text keyword
 * @query  page    (optional) page number, default=1
 * @query  limit   (optional) items per page, default=20
 */
router.get('/groups', searchGroups);

export default router;
