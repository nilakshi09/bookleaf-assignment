import React, { useState, useEffect } from 'react';
import { Sparkles, Send, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import api from '../../services/api.js';

export const AIReplyBox = ({ ticket, onUpdate }) => {
  const [replyText, setReplyText] = useState(ticket.aiDraft || '');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setReplyText(ticket.aiDraft || '');
  }, [ticket.aiDraft]);

  const isClosed = ticket.status === 'Closed';

  const handleGenerateDraft = async () => {
    try {
      setGenerating(true);
      const res = await api.post(`/admin/tickets/${ticket._id}/draft`);
      setReplyText(res.data.aiDraft);
    } catch (err) {
      console.error('Failed to generate draft:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    try {
      setSending(true);
      const res = await api.post(`/admin/tickets/${ticket._id}/reply`, {
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

  if (isClosed) {
    return (
      <div className="card border-line-dark bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Lock className="h-4 w-4 text-subtle shrink-0" />
          <span>
            This ticket has been marked Closed. To send a reply, update the ticket status to Open or In Progress.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-brand/30 bg-surface p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-ink">AI-Drafted Official Reply</h4>
            <span className="text-[11px] text-muted">
              Policy-grounded response ready to review & send
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateDraft}
          disabled={generating}
          className="btn-secondary text-xs px-3 py-1 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Drafting...' : 'Regenerate Draft'}
        </button>
      </div>

      {/* Rule fallback warning if AI was unavailable */}
      {ticket.aiStatus === 'failed' && (
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800 font-medium">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>AI was unavailable, so this category and priority were set by rules. Please check them.</span>
        </div>
      )}

      {/* Editable Reply Form */}
      <form onSubmit={handleSendReply} className="space-y-3">
        <textarea
          rows={7}
          required
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Click 'Regenerate Draft' to create an AI response, or write your message here..."
          className="input resize-none text-xs leading-relaxed"
        />

        {/* Footer: Character count & Send Action */}
        <div className="flex items-center justify-between pt-2 border-t border-line/70">
          <span className="text-[11px] text-muted">{replyText.length} characters</span>

          <button
            type="submit"
            disabled={!replyText.trim() || sending}
            className="btn-primary text-xs px-5 py-2 flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? 'Sending Reply...' : 'Send AI Reply'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIReplyBox;
