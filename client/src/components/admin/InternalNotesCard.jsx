import React, { useState } from 'react';
import { Lock, Plus, User, Clock, ShieldAlert } from 'lucide-react';
import api from '../../services/api.js';

export const InternalNotesCard = ({ ticket, onUpdate }) => {
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const notes = ticket.internalNotes || [];

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || submitting) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/admin/tickets/${ticket._id}/notes`, {
        text: noteText.trim(),
      });
      onUpdate(res.data);
      setNoteText('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card border-amber-200 bg-amber-50/30 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-amber-950">Internal Staff Notes</h4>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              Private • Staff Eyes Only
            </span>
          </div>
        </div>
        <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
          {notes.length}
        </span>
      </div>

      {/* Existing Notes List */}
      <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="text-center py-4 text-xs text-amber-800/80 italic">
            No internal notes recorded yet. Add operational context or updates for other staff members below.
          </div>
        ) : (
          notes.map((n, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-amber-200/80 bg-white p-3 text-xs text-ink shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-amber-100 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-800 text-[10px]">
                    {n.admin?.name ? n.admin.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <span>{n.admin?.name || 'Staff Member'}</span>
                </div>
                <span className="text-muted text-[10px] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-subtle" />
                  {new Date(n.createdAt).toLocaleDateString([], {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-ink-light">{n.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleAddNote} className="mt-4 pt-3 border-t border-amber-200/80 space-y-2">
        <textarea
          rows={2}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add team note (e.g. cross-verified printer proof with Delhi facility)..."
          className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-ink outline-none placeholder:text-subtle focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!noteText.trim() || submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-amber-900 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {submitting ? 'Adding...' : 'Add Private Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InternalNotesCard;
