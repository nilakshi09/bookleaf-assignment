import express from 'express';
import {
  getAuthorBooks,
  createTicket,
  getMyTickets,
  addAuthorReply,
  markTicketReadByAuthor,
} from '../controllers/authorController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All author routes require valid authentication
router.use(verifyToken);

router.get('/books', getAuthorBooks);
router.post('/tickets', createTicket);
router.get('/tickets/mine', getMyTickets);
router.post('/tickets/:id/replies', addAuthorReply);
router.post('/tickets/:id/read', markTicketReadByAuthor);

export default router;
