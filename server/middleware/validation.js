import { ALLOWED_CATEGORIES, ALLOWED_PRIORITIES, ALLOWED_STATUSES } from '../config/constants.js';
import User from '../models/User.js';

/**
 * Validates that login body contains string email and password, preventing object query injection.
 */
export const validateLoginPayload = (req, res, next) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required and must be valid strings.' });
  }

  next();
};

/**
 * Validates and sanitizes admin ticket queue filters.
 */
export const validateQueueFilters = (req, res, next) => {
  const { status, category, priority, assignedTo, date } = req.query;

  // 1. Status whitelist validation
  if (status !== undefined) {
    if (typeof status !== 'string' || (!ALLOWED_STATUSES.includes(status) && status !== 'all')) {
      return res.status(400).json({ message: 'Invalid status filter' });
    }
  }

  // 2. Category whitelist validation
  if (category !== undefined) {
    if (typeof category !== 'string' || !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category filter' });
    }
  }

  // 3. Priority whitelist validation
  if (priority !== undefined) {
    if (typeof priority !== 'string' || !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority filter' });
    }
  }

  // 4. Date filter validation (YYYY-MM-DD aligned to Indian Standard Time UTC+5:30)
  if (date !== undefined) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date filter format. Use YYYY-MM-DD.' });
    }

    const startOfDay = new Date(`${date}T00:00:00.000+05:30`);
    const endOfDay = new Date(`${date}T23:59:59.999+05:30`);

    if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
      return res.status(400).json({ message: 'Invalid date filter' });
    }

    req.istDateFilter = { $gte: startOfDay, $lte: endOfDay };
  }

  // 5. AssignedTo filter validation
  if (assignedTo !== undefined) {
    if (typeof assignedTo !== 'string') {
      return res.status(400).json({ message: 'Invalid assignedTo filter' });
    }
  }

  next();
};

/**
 * Validates administrative ticket update parameters.
 */
export const validateTicketUpdate = async (req, res, next) => {
  const { status, category, priority, assignedTo } = req.body;

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  if (category !== undefined && !ALLOWED_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Invalid category value' });
  }

  if (priority !== undefined && !ALLOWED_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: 'Invalid priority value' });
  }

  if (assignedTo !== undefined && assignedTo !== null && assignedTo !== '') {
    const adminUser = await User.findOne({ _id: assignedTo, role: 'admin' });
    if (!adminUser) {
      return res.status(400).json({ message: 'Invalid assignedTo. Target user is not an active admin.' });
    }
  }

  next();
};
