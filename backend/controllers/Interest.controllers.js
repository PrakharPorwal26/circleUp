import CustomInterest from '../models/CustomInterest.models.js';
import { INTERESTS } from '../data/interests.js';

export const getAllInterests = (req, res) => {
  res.json({ data: INTERESTS });
};

export const getCustomInterests = async (req, res, next) => {
  try {
    const data = await CustomInterest.find().sort({ count: -1 });
    res.json({ count: data.length, data });
  } catch (err) {
    next(err);
  }
};
