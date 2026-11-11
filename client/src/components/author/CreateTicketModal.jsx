import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Book, Send } from 'lucide-react';
import api from '../../services/api.js';

export const CreateTicketModal = ({ isOpen, onClose, books = [], onCreated, initialBookId = '' }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [bookId, setBookId] = useState(initialBookId || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBookId(initialBookId || '');
      setError('');
    }
  }, [isOpen, initialBookId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a subject and a description of your issue.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        subject: subject.trim(),
        description: description.trim(),
        bookId: bookId || undefined,
      };

      const res = await api.post('/tickets', payload);
      onCreated(res.data);
      onClose();
      setSubject('');
      setDescription('');
      setBookId('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-line-dark bg-surface p-6 shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark">
              Author Help Desk
            </span>
            <h2 className="font-display text-xl font-bold text-ink">Raise a Support Ticket</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-blush-soft hover:text-ink cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Book selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
              Related Book (Optional)
            </label>
            <div className="relative">
              <select
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="input cursor-pointer"
              >
                <option value="">General / Account Inquiry (No Book Selected)</option>
                {books.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} (ISBN: {b.isbn})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                Subject
              </label>
              <span className="text-[11px] text-subtle">{subject.length}/100</span>
            </div>
            <input
              type="text"
              maxLength={100}
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Missing Q3 Royalty Transfer, Barcode defect on paperback..."
              className="input font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
              Detailed Description
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, any dates, numbers, or questions you have for the BookLeaf team..."
              className="input resize-none leading-relaxed"
            />
          </div>

          {/* AI Automated Triage Explanatory Banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-brand/20 bg-blush p-3 text-xs text-ink-light">
            <Sparkles className="h-4 w-4 text-brand shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-brand-dark block">Sub-Second Ticket Routing</span>
              <span>
                Your ticket is created immediately. BookLeaf AI analyzes your request in the background, categorizes it, and notifies our support specialists.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary text-xs px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs px-5 flex items-center gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Creating Ticket...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
