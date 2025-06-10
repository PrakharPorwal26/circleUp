import Group from '../models/Group.models.js';
import Event from '../models/Event.models.js';

export const searchGroups = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (q) {
      filter.$text = { $search: q };
    }

    const skip = (page - 1) * limit;
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

export const searchEvents = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (q) {
      filter.$text = { $search: q };
    }

    const skip = (page - 1) * limit;
    const sort = q
      ? { score: { $meta: 'textScore' } }
      : { dateTime: -1 };

    const [total, data] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter, q ? { score: { $meta: 'textScore' } } : {})
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select('title description location dateTime groupId')
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
