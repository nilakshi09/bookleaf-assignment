/**
 * Centralized Socket.IO event emitter service.
 * Enforces room-targeting and privacy scrubbing rules across all events.
 */

let ioInstance = null;

export const setSocketInstance = (io) => {
  ioInstance = io;
};

export const getSocketInstance = () => ioInstance;

/**
 * Strips confidential admin-only fields before sending ticket data to an author.
 */
export const sanitizeTicketForAuthor = (ticketDoc) => {
  if (!ticketDoc) return null;
  const obj = typeof ticketDoc.toObject === 'function' ? ticketDoc.toObject() : { ...ticketDoc };

  delete obj.internalNotes;
  delete obj.aiDraft;
  delete obj.unreadByAdmin;

  return obj;
};

/**
 * Emits an event strictly to the administrative room.
 */
export const emitToAdmins = (event, data) => {
  if (ioInstance) {
    ioInstance.to('admins').emit(event, data);
  }
};

/**
 * Emits an event safely to a specific author's private room.
 */
export const emitToAuthor = (authorId, event, data) => {
  if (ioInstance && authorId) {
    const safeData = sanitizeTicketForAuthor(data);
    ioInstance.to(authorId.toString()).emit(event, safeData);
  }
};

/**
 * Synchronizes ticket updates across both admins and the ticket author.
 */
export const emitTicketUpdated = (ticketDoc) => {
  if (!ioInstance || !ticketDoc) return;

  // 1. Full payload with notes and AI draft to admins
  const adminPayload = typeof ticketDoc.toObject === 'function' ? ticketDoc.toObject() : ticketDoc;
  ioInstance.to('admins').emit('ticket:updated', adminPayload);

  // 2. Sanitized copy to the author's room
  const authorId = ticketDoc.author?._id || ticketDoc.author;
  if (authorId) {
    emitToAuthor(authorId, 'ticket:updated', ticketDoc);
  }
};

/**
 * Notifies admins that background AI classification has completed.
 * Authors NEVER receive this event.
 */
export const emitTicketClassified = (ticketDoc) => {
  if (!ioInstance || !ticketDoc) return;
  const adminPayload = typeof ticketDoc.toObject === 'function' ? ticketDoc.toObject() : ticketDoc;
  ioInstance.to('admins').emit('ticket:classified', adminPayload);
};

/**
 * Notifies admins when a ticket has been marked read by staff.
 */
export const emitTicketReadByAdmin = (ticketId) => {
  if (!ioInstance || !ticketId) return;
  ioInstance.to('admins').emit('ticket:read', { ticketId });
};

/**
 * Notifies an author when a ticket has been marked read.
 */
export const emitTicketReadByAuthor = (authorId, ticketId) => {
  if (!ioInstance || !authorId || !ticketId) return;
  ioInstance.to(authorId.toString()).emit('ticket:read', { ticketId });
};
