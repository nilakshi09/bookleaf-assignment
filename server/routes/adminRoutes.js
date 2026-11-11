import express from 'express';
import {
  getTicketsQueue,
  getTicketById,
  markTicketReadByAdmin,
  updateTicket,
  generateDraft,
  rewriteDraft,
  sendAdminReply,
  addInternalNote,
} from '../controllers/adminController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { aiDraftLimiter } from '../middleware/rateLimiter.js';
import { validateQueueFilters, validateTicketUpdate } from '../middleware/validation.js';

const router = express.Router();

// Enforce admin privileges on all administrative routes
router.use(verifyToken, requireRole(['admin']));

router.get('/tickets', validateQueueFilters, getTicketsQueue);
router.get('/tickets/:id', getTicketById);
router.post('/tickets/:id/read', markTicketReadByAdmin);
router.patch('/tickets/:id', validateTicketUpdate, updateTicket);
router.post('/tickets/:id/draft', aiDraftLimiter, generateDraft);
router.post('/tickets/:id/rewrite', aiDraftLimiter, rewriteDraft);
router.post('/tickets/:id/reply', sendAdminReply);
router.post('/tickets/:id/notes', addInternalNote);

export default router;
