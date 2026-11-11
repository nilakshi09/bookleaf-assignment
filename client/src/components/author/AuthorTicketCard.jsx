import React, { useState } from 'react';
import {
  Book,
  ChevronDown,
  ChevronUp,
  Send,
  ShieldCheck,
  Lock,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import PriorityBadge from '../common/PriorityBadge.jsx';
import CategoryBadge from '../common/CategoryBadge.jsx';
import api from '../../services/api.js';

export const AuthorTicketCard = ({ ticket, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const replies = ticket.replies || [];
  const isClosed = ticket.status === 'Closed';

  const handleToggleExpand = async () => {
    const nextState = !expanded;
    setExpanded(nextState);

    // When opening an unread message, mark read on server and remove green dot
    if (nextState && ticket.unreadByAuthor) {
      try {
        await api.post(`/tickets/${ticket._id}/read`);
        onUpdate({ ...ticket, unreadByAuthor: false });
        window.dispatchEvent(new CustomEvent('ticket:read', { detail: { id: ticket._id } }));
      } catch (err) {
        console.warn('Failed to mark read:', err.message);
      }
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    try {
      setSending(true);
      const res = await api.post(`/tickets/${ticket._id}/replies`, {
        message: replyText.trim(),
      });
      onUpdate(res.data);
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card border-line hover:border-brand/30 bg-surface shadow-xs transition-all mb-4">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-line/70">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={ticket.category} size="sm" />
          <StatusBadge status={ticket.status} size="sm" />
          <PriorityBadge priority={ticket.priority} size="sm" />

          {/* Green dot indicator when unread */}
          {ticket.unreadByAuthor && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              New reply from Support
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <Clock className="h-3.5 w-3.5 text-subtle" />
          <span>
            {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Subject & Book details */}
      <div className="mt-3.5">
        <h3 className="font-display text-base font-bold text-ink sm:text-lg leading-snug">
          {ticket.subject}
        </h3>

        {ticket.book && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blush/60 px-2.5 py-1 text-xs text-ink-light border border-line">
            <Book className="h-3.5 w-3.5 text-brand shrink-0" />
            <span className="font-semibold text-ink">{ticket.book.title}</span>
            <span className="font-mono text-[10px] text-muted">ISBN: {ticket.book.isbn}</span>
          </div>
        )}
      </div>

      {/* Footer: Expand toggle */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-line/70 text-xs">
        <span className="text-muted flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-subtle" />
          <span>{replies.length} {replies.length === 1 ? 'response' : 'responses'}</span>
        </span>

        <button
          type="button"
          onClick={handleToggleExpand}
          className="btn-ghost text-xs px-3 py-1 text-brand-dark hover:bg-brand-light font-semibold cursor-pointer"
        >
          {expanded ? 'Hide Thread' : 'Open Thread'}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expandable Conversation Section */}
      {expanded && (
        <div className="mt-5 pt-5 border-t border-line space-y-5">
          {/* Initial author inquiry */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
              <span>Your Original Inquiry</span>
            </div>
            <div className="rounded-2xl border border-line bg-blush/40 p-4 text-xs text-ink leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {/* Conversation history */}
          {replies.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-line/80"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Official Replies
                </span>
                <div className="flex-grow border-t border-line/80"></div>
              </div>

              {replies.map((reply, idx) => {
                const isSupport = reply.from === 'admin';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isSupport ? 'items-start mr-6' : 'items-end ml-6'}`}
                  >
                    <div
                      className={`rounded-2xl p-4 text-xs leading-relaxed shadow-2xs max-w-2xl w-full sm:w-auto ${
                        isSupport
                          ? 'bg-white border border-brand/30 shadow-xs text-ink'
                          : 'bg-brand/10 border border-brand/20 text-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-line/60 text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isSupport ? (
                            <>
                              <ShieldCheck className="h-4 w-4 text-brand" />
                              <span className="text-brand-dark">BookLeaf Support Team</span>
                            </>
                          ) : (
                            <span className="text-ink">You</span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted">
                          {new Date(reply.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{reply.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply composer */}
          <div className="pt-2">
            {isClosed ? (
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-xs text-muted">
                <Lock className="h-4 w-4 text-subtle shrink-0" />
                <span>
                  This ticket has been marked Closed. If you have any further questions, please raise a new ticket.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="space-y-2.5">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your follow-up reply to BookLeaf Support..."
                  className="input resize-none text-xs"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending ? 'Sending...' : 'Send Follow-up'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorTicketCard;
