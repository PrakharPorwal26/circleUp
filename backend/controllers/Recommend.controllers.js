import User from '../models/User.models.js';
import Group from '../models/Group.models.js';

// Recommend Groups based on interests and optional location filter
export const recommendGroups = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { lat, lng, radius } = req.query;
    const interestFilter = { tags: { $in: user.interests } };

    // Exclude groups where user is already a member
    const excludeMember = { 'members.user': { $ne: req.userId } };

    let query = { privacy: 'public', ...interestFilter, ...excludeMember };

    // If location params provided, add geo filter
    if (lat && lng) {
      const dist = parseInt(radius) || 10000; // default 10km
      query.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: dist
        }
      };
    }

    const groups = await Group.find(query)
      .limit(20)
      .select('-joinRequests -inviteCodes -mediaGallery -notifications -auditLog');

    res.json({ data: groups });
  } catch (err) {
    next(err);
  }
};

// Recommend Users based on interests and same city
export const recommendUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userCity = user.city;
    const interestFilter = { interests: { $in: user.interests } };

    const users = await User.find({
      _id: { $ne: req.userId },
      city: userCity,
      ...interestFilter
    })
      .limit(20)
      .select('name email avatar city interests');

    res.json({ data: users });
  } catch (err) {
    next(err);
  }
};