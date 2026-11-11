import React from 'react';
import { ShieldCheck, User, MessageSquare, Clock } from 'lucide-react';

export const AdminConversation = ({ ticket }) => {
  const replies = ticket.replies || [];
  const authorInitial = ticket.author?.name ? ticket.author.name.charAt(0).toUpperCase() : 'A';

  return (
    <div className="card border-line bg-surface shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-ink">Author Inquiry & Conversation Thread</h4>
            <span className="text-[11px] text-muted">
              Live author conversation thread ({replies.length + 1} messages)
            </span>
          </div>
        </div>
      </div>

      {/* Author's Initial Problem Statement */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-2 font-bold text-ink">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/15 text-brand text-xs">
              {authorInitial}
            </div>
            <span>{ticket.author?.name || 'Author'} (Initial Inquiry)</span>
          </div>
          <span className="text-[11px] flex items-center gap-1">
            <Clock className="h-3 w-3 text-subtle" />
            {new Date(ticket.createdAt).toLocaleString([], {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>

        <div className="rounded-2xl border border-line bg-blush/40 p-5 text-sm text-ink leading-relaxed whitespace-pre-wrap shadow-2xs">
          {ticket.description}
        </div>
      </div>

      {/* Conversation replies */}
      {replies.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-line/80"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-muted">
              Conversation Updates
            </span>
            <div className="flex-grow border-t border-line/80"></div>
          </div>

          <div className="space-y-4">
            {replies.map((r, idx) => {
              const isSupport = r.from === 'admin';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isSupport ? 'items-end ml-6' : 'items-start mr-6'}`}
                >
                  <div
                    className={`rounded-2xl p-4.5 text-sm leading-relaxed shadow-xs max-w-2xl w-full sm:w-auto ${
                      isSupport
                        ? 'bg-white border border-brand/30 shadow-2xs'
                        : 'bg-blush/50 border border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-line/60 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        {isSupport ? (
                          <div className="flex items-center gap-1.5 text-brand-dark">
                            <ShieldCheck className="h-4 w-4 text-brand" />
                            <span>BookLeaf Support Desk</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-ink">
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-brand/15 text-brand text-[10px]">
                              {authorInitial}
                            </div>
                            <span>{ticket.author?.name || 'Author'}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-muted">
                        {new Date(r.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-ink">{r.message}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConversation;
