import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    dp: { type: String, default: '' }, // Display picture URL
    privacy: { type: String, enum: ['public', 'private', 'secret'], default: 'public' },
    tags: { type: [String], default: [] }, // Categories/tags
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    capacity: { type: Number, default: 0 },
    inviteCodes: [
      {
        code: { type: String },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date }
      }
    ],
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner','admin','moderator','member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    joinRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        requestedAt: { type: Date, default: Date.now }
      }
    ],
    pinnedPost: {
      title: { type: String },
      content: { type: String },
      createdAt: { type: Date }
    },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    mediaGallery: [
      {
        url: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    notifications: [
      {
        _id: false,
        id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    auditLog: [
      {
        action: { type: String },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        metadata: mongoose.Schema.Types.Mixed
      }
    ]
  },
  { timestamps: true }
);

groupSchema.index({ location: '2dsphere' });
export default mongoose.model('Group', groupSchema);
