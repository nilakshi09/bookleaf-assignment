import Ticket from '../models/Ticket.js';
import Book from '../models/Book.js';
import {
  classifyTicket,
  draftReply,
  generatePolicyFallbackDraft,
} from '../services/aiService.js';
import {
  emitTicketUpdated,
  emitTicketClassified,
  emitTicketReadByAuthor,
  sanitizeTicketForAuthor,
} from '../services/socketService.js';

/**
 * Returns all books registered to the logged-in author.
 */
export const getAuthorBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ author: req.user.id }).sort({ title: 1 });
    res.json(books);
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a support ticket with sub-second response time.
 * Asynchronously triages category and generates initial draft in the background.
 */
export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, bookId } = req.body;

    if (!subject || !subject.trim() || !description || !description.trim()) {
      return res.status(400).json({ message: 'Subject and description are required.' });
    }

    // Optional book verification
    let linkedBook = null;
    if (bookId) {
      linkedBook = await Book.findOne({ _id: bookId, author: req.user.id });
      if (!linkedBook) {
        return res.status(400).json({ message: 'Selected book does not belong to your account.' });
      }
    }

    // 1. Create immediately with default triage values
    const ticket = await Ticket.create({
      author: req.user.id,
      book: linkedBook ? linkedBook._id : null,
      subject: subject.trim(),
      description: description.trim(),
      category: 'General Inquiry',
      priority: 'Medium',
      aiStatus: 'pending',
      unreadByAdmin: true,
      unreadByAuthor: false,
    });

    // Populate relations for response & socket
    const populated = await Ticket.findById(ticket._id)
      .populate('book')
      .populate('author', 'name email');

    // 2. Respond immediately to author with sanitized ticket (<100ms)
    res.status(201).json(sanitizeTicketForAuthor(populated));

    // 3. Notify admins immediately of the new incoming ticket
    emitTicketUpdated(populated);

    // 4. Detached background triage & draft worker
    (async () => {
      try {
        // Run AI classification
        const classification = await classifyTicket(subject, description);

        // Atomic update only if triage is still pending (respects any interim admin overrides)
        const updated = await Ticket.findOneAndUpdate(
          { _id: ticket._id, aiStatus: 'pending' },
          {
            $set: {
              category: classification.category,
              priority: classification.priority,
              aiStatus: classification.aiStatus,
            },
          },
          { new: true }
        )
          .populate('book')
          .populate('author', 'name email');

        if (updated) {
          emitTicketClassified(updated);
          emitTicketUpdated(updated);

          // Generate initial reply draft
          const startStatus = updated.status;
          const startReplyCount = updated.replies.length;

          let draft = '';
          try {
            draft = await draftReply(updated, updated.book, updated.replies);
          } catch (err) {
            console.warn('[AI Service] Initial draft failed, using fallback:', err.message);
            draft = generatePolicyFallbackDraft(updated, updated.book, updated.replies);
          }

          // Save draft atomically only if ticket status or replies have not changed
          const draftUpdated = await Ticket.findOneAndUpdate(
            {
              _id: updated._id,
              status: startStatus,
              replies: { $size: startReplyCount },
            },
            {
              $set: {
                aiDraft: draft,
                aiStatus: updated.aiStatus === 'failed' ? 'failed' : 'done',
              },
            },
            { new: true }
          )
            .populate('book')
            .populate('author', 'name email');

          if (draftUpdated) {
            emitTicketUpdated(draftUpdated);
          }
        }
      } catch (bgError) {
        console.warn('[Background Triage] Error occurred:', bgError.message);
      }
    })();
  } catch (error) {
    next(error);
  }
};

/**
 * Returns all tickets raised by the authenticated author.
 * Strictly strips internal notes, AI drafts, and admin flags.
 */
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ author: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('book')
      .populate('author', 'name email');

    const sanitized = tickets.map((t) => sanitizeTicketForAuthor(t));
    res.json(sanitized);
  } catch (error) {
    next(error);
  }
};

/**
 * Submits an author reply to an open conversation thread.
 */
export const addAuthorReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message cannot be empty.' });
    }

    const ticket = await Ticket.findOne({ _id: id, author: req.user.id }).populate('book');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    if (ticket.status === 'Closed') {
      return res.status(400).json({ message: 'Cannot reply to a closed ticket.' });
    }

    ticket.replies.push({
      message: message.trim(),
      sentBy: req.user.id,
      from: 'author',
    });

    ticket.unreadByAdmin = true;
    ticket.unreadByAuthor = false;
    ticket.aiDraft = ''; // Invalidate old draft
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('book')
      .populate('author', 'name email');

    res.json(sanitizeTicketForAuthor(populated));
    emitTicketUpdated(populated);

    // Background: generate fresh contextual draft for staff
    (async () => {
      try {
        const startStatus = populated.status;
        const startReplyCount = populated.replies.length;

        let draft = '';
        try {
          draft = await draftReply(populated, populated.book, populated.replies);
        } catch (err) {
          draft = generatePolicyFallbackDraft(populated, populated.book, populated.replies);
        }

        const draftUpdated = await Ticket.findOneAndUpdate(
          {
            _id: populated._id,
            status: startStatus,
            replies: { $size: startReplyCount },
          },
          {
            $set: { aiDraft: draft, aiStatus: populated.aiStatus === 'failed' ? 'failed' : 'done' },
          },
          { new: true }
        )
          .populate('book')
          .populate('author', 'name email');

        if (draftUpdated) {
          emitTicketUpdated(draftUpdated);
        }
      } catch (bgError) {
        console.warn('[Background Draft] Error:', bgError.message);
      }
    })();
  } catch (error) {
    next(error);
  }
};

/**
 * Marks ticket as read by the author and broadcasts the read status.
 */
export const markTicketReadByAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Ticket.findOneAndUpdate(
      { _id: id, author: req.user.id },
      { $set: { unreadByAuthor: false } }
    );
    res.json({ message: 'ok' });
    emitTicketReadByAuthor(req.user.id, id);
  } catch (error) {
    next(error);
  }
};
