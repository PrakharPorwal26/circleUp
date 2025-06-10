import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    dateTime: {
      type: Date,
      required: [true, 'Date & time are required']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rsvps: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    interested: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    pastEventPhotos: {
      type: [String], // Cloudinary URLs
      default: []
    }
  },
  {
    timestamps: true
  }
);

eventSchema.index(
  { title: 'text', description: 'text', location: 'text' },
  { name: 'EventTextIndex' }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
