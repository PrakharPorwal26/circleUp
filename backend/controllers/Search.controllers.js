import Group from '../models/Group.models.js';

// GET /api/v1/search/groups
export const searchGroups = async (req, res, next) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;
    const filter = {};

    if (q) {
      filter.$text = { $search: q };
    }

    const skip = (page - 1) * limit;
    // If doing text search, sort by textScore; otherwise newest first
    const sort = q
      ? { score: { $meta: 'textScore' } }
      : { createdAt: -1 };

    const [total, data] = await Promise.all([
      Group.countDocuments(filter),
      Group.find(filter, q ? { score: { $meta: 'textScore' } } : {})
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select('name description tags dp location capacity privacy')
        .lean()
    ]);

    res.json({
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};
