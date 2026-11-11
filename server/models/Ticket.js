import mongoose from 'mongoose';
import { ALLOWED_CATEGORIES, ALLOWED_PRIORITIES, ALLOWED_STATUSES } from '../config/constants.js';

// Public reply subdocument schema (visible to both author and admins)
const replySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  from: {
    type: String,
    enum: ['author', 'admin'],
    default: 'admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Confidential internal note subdocument schema (visible strictly to staff)
const internalNoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ticketSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ALLOWED_STATUSES,
      default: 'Open',
      index: true,
    },
    category: {
      type: String,
      enum: ALLOWED_CATEGORIES,
      default: 'General Inquiry',
    },
    priority: {
      type: String,
      enum: ALLOWED_PRIORITIES,
      default: 'Medium',
    },
    aiStatus: {
      type: String,
      enum: ['pending', 'done', 'failed'],
      default: 'pending',
    },
    aiDraft: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    unreadByAdmin: {
      type: Boolean,
      default: false,
    },
    unreadByAuthor: {
      type: Boolean,
      default: false,
    },
    replies: [replySchema],
    internalNotes: [internalNoteSchema],
  },
  {
    timestamps: true,
  }
);

// Helpful compound indexes for queue sorting and author ticket retrieval
ticketSchema.index({ status: 1, priority: 1, createdAt: 1 });
ticketSchema.index({ author: 1, createdAt: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
