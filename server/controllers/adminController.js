import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import {
  draftReply,
  rewriteReply,
  generatePolicyFallbackDraft,
} from '../services/aiService.js';
import {
  emitTicketUpdated,
  emitTicketReadByAdmin,
} from '../services/socketService.js';
import { ALLOWED_STATUSES } from '../config/constants.js';

/**
 * Returns the administrative ticket queue sorted with urgent active tickets first.
 */
export const getTicketsQueue = async (req, res, next) => {
  try {
    const { status, category, priority, assignedTo } = req.query;
    const filter = {};

    // 1. Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // 2. Category filter
    if (category) {
      filter.category = category;
    }

    // 3. Priority filter
    if (priority) {
      filter.priority = priority;
    }

    // 4. AssignedTo filter
    if (assignedTo === 'me') {
      filter.assignedTo = req.user.id;
    } else if (assignedTo === 'unassigned') {
      filter.assignedTo = null;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // 5. IST Date filter
    if (req.istDateFilter) {
      filter.createdAt = req.istDateFilter;
    }

    const tickets = await Ticket.find(filter)
      .populate('book')
      .populate('author', 'name email phone city')
      .populate('assignedTo', 'name email');

    // Custom sorting: Open/In Progress prioritized by urgency (Critical -> High -> Medium -> Low),
    // oldest first; Resolved & Closed pushed to the bottom.
    const priorityWeights = { Critical: 4, High: 3, Medium: 2, Low: 1 };

    tickets.sort((a, b) => {
      const aIsDone = a.status === 'Resolved' || a.status === 'Closed';
      const bIsDone = b.status === 'Resolved' || b.status === 'Closed';

      if (aIsDone && !bIsDone) return 1;
      if (!aIsDone && bIsDone) return -1;

      if (!aIsDone && !bIsDone) {
        const weightDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
        if (weightDiff !== 0) return weightDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

/**
 * Returns full ticket details including notes, author details, and book record.
 * Strictly read-only: does NOT write to the database.
 */
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate('book')
      .populate('author', 'name email phone city')
      .populate('assignedTo', 'name email')
      .populate('internalNotes.admin', 'name email')
      .populate('replies.sentBy', 'name email role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

/**
 * Marks a ticket as read by staff and synchronizes unread badges across admins.
 */
export const markTicketReadByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Ticket.findByIdAndUpdate(id, { $set: { unreadByAdmin: false } });

    res.json({ message: 'ok' });
    emitTicketReadByAdmin(id);
  } catch (error) {
    next(error);
  }
};

/**
 * Updates ticket metadata (status, category, priority, assignment).
 */
export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, category, priority, assignedTo } = req.body;

    const ticket = await Ticket.findById(id).populate('book');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;

    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo || null;
    }

    if (status && status !== ticket.status) {
      ticket.status = status;

      // If closing ticket, automatically add polite closing reply and set unreadByAuthor
      if (status === 'Closed') {
        const closingMsg =
          'As you confirmed that your issue has been solved, we are closing this ticket. Thank you for publishing with BookLeaf Publishing.';
        ticket.replies.push({
          message: closingMsg,
          sentBy: req.user.id,
          from: 'admin',
        });
        ticket.unreadByAuthor = true;
      }
    }

    ticket.aiDraft = ''; // Invalidate cached draft on status/category update
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('book')
      .populate('author', 'name email phone city')
      .populate('assignedTo', 'name email')
      .populate('internalNotes.admin', 'name email')
      .populate('replies.sentBy', 'name email role');

    res.json(populated);
    emitTicketUpdated(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * Generates an AI draft reply.
 * Previewing an alternate status generates a draft in-memory WITHOUT mutating the saved database ticket.
 */
export const generateDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: overrideStatus } = req.body;

    const ticket = await Ticket.findById(id).populate('book').populate('author', 'name email');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // Build plain in-memory copy for prompt guidance to preserve database integrity
    const draftTicket = ticket.toObject();
    if (overrideStatus && ALLOWED_STATUSES.includes(overrideStatus)) {
      draftTicket.status = overrideStatus;
    }

    let draft = '';
    try {
      draft = await draftReply(draftTicket, draftTicket.book, draftTicket.replies);
    } catch (err) {
      console.warn('[AI Service] Draft failed, using fallback:', err.message);
      draft = generatePolicyFallbackDraft(draftTicket, draftTicket.book, draftTicket.replies);
    }

    // Only cache to database if no status override is active
    if (!overrideStatus || overrideStatus === ticket.status) {
      ticket.aiDraft = draft;
      ticket.aiStatus = 'done';
      await ticket.save();
    }

    res.json({ aiDraft: draft, aiStatus: 'done' });
  } catch (error) {
    next(error);
  }
};

/**
 * Rewrites an existing draft into one of 4 stylistic modes.
 */
export const rewriteDraft = async (req, res, next) => {
  try {
    const { text, mode } = req.body;

    if (!text || !text.trim() || !mode) {
      return res.status(400).json({ message: 'Draft text and rewrite mode are required.' });
    }

    const rewrittenText = await rewriteReply(text, mode);
    res.json({ rewrittenText });
  } catch (error) {
    next(error);
  }
};

/**
 * Sends an official staff reply to the author.
 */
export const sendAdminReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, markResolved, markClosed } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message cannot be empty.' });
    }

    const ticket = await Ticket.findById(id).populate('book');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    if (ticket.status === 'Closed') {
      return res.status(400).json({ message: 'Cannot reply to a closed ticket.' });
    }

    ticket.replies.push({
      message: message.trim(),
      sentBy: req.user.id,
      from: 'admin',
    });

    if (markClosed) {
      ticket.status = 'Closed';
    } else if (markResolved) {
      ticket.status = 'Resolved';
    }

    ticket.unreadByAuthor = true;
    ticket.unreadByAdmin = false;
    ticket.aiDraft = ''; // Clear draft after sending reply
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('book')
      .populate('author', 'name email phone city')
      .populate('assignedTo', 'name email')
      .populate('internalNotes.admin', 'name email')
      .populate('replies.sentBy', 'name email role');

    res.json(populated);
    emitTicketUpdated(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * Adds an internal private note visible only to staff members.
 */
export const addInternalNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Note text cannot be empty.' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    ticket.internalNotes.push({
      text: text.trim(),
      admin: req.user.id,
    });

    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('book')
      .populate('author', 'name email phone city')
      .populate('assignedTo', 'name email')
      .populate('internalNotes.admin', 'name email')
      .populate('replies.sentBy', 'name email role');

    res.json(populated);
    // Emit only to admins room (author must NEVER see internal notes)
    emitTicketUpdated(populated);
  } catch (error) {
    next(error);
  }
};
