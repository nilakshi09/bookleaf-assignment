/**
 * Application-wide constants and whitelists for BookLeaf Support Portal.
 */

export const ALLOWED_CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

export const ALLOWED_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export const ALLOWED_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export const REWRITE_MODES = ['Polish', 'Shorter', 'More empathetic', 'More formal'];

export const AI_TIMEOUT_MS = 12000;
