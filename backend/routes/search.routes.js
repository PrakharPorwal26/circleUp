import express from 'express';
import {
  searchGroups,
  searchEvents
} from '../controllers/Search.controllers.js';

const router = express.Router();

/**
 * GET /api/v1/search/groups
 * @query q     (optional) free-text keyword
 * @query page  (optional) default=1
 * @query limit (optional) default=20
 */
router.get('/groups', searchGroups);

/**
 * GET /api/v1/search/events
 * @query q     (optional) free-text keyword
 * @query page  (optional) default=1
 * @query limit (optional) default=20
 */
router.get('/events', searchEvents);

export default router;
