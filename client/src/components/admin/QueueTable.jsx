import React from 'react';
import { Link } from 'react-router-dom';
import { Book, ArrowUpRight, Clock, Sparkles, User, AlertCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import PriorityBadge from '../common/PriorityBadge.jsx';
import CategoryBadge from '../common/CategoryBadge.jsx';

export const QueueTable = ({ tickets = [] }) => {
  if (tickets.length === 0) {
    return (
      <div className="card text-center py-16 border-line bg-surface">
        <Clock className="mx-auto h-10 w-10 text-subtle mb-3" />
        <h3 className="font-display text-base font-bold text-ink">No tickets found in queue</h3>
        <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
          No support inquiries match your active filter criteria. Try resetting or adjusting your filters.
        </p>
      </div>
    );
  }

  // Format relative time with aging color
  const formatAge = (createdAt) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let text = `${diffHours}h ago`;
    let color = 'text-muted';

    if (diffDays >= 3) {
      text = `${diffDays}d ago`;
      color = 'text-rose-700 font-bold';
    } else if (diffDays >= 1) {
      text = `${diffDays}d ago`;
      color = 'text-amber-700 font-semibold';
    } else if (diffHours < 1) {
      text = 'Just now';
      color = 'text-emerald-700 font-semibold';
    }

    return <span className={color}>{text}</span>;
  };

  return (
    <div className="card overflow-hidden border-line bg-surface p-0 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-line bg-blush/60 text-[10px] font-bold uppercase tracking-wider text-muted">
              <th className="py-3.5 px-5">Ticket & Context</th>
              <th className="py-3.5 px-4">Author Dossier</th>
              <th className="py-3.5 px-4">Priority / SLA</th>
              <th className="py-3.5 px-4">Triage & Status</th>
              <th className="py-3.5 px-4">Age</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60 bg-surface">
            {tickets.map((t) => {
              const isCritical = t.priority === 'Critical';
              const isHigh = t.priority === 'High';
              const authorInitial = t.author?.name ? t.author.name.charAt(0).toUpperCase() : 'A';

              return (
                <tr
                  key={t._id}
                  className={`transition-colors hover:bg-blush/30 ${
                    isCritical
                      ? 'border-l-4 border-l-rose-600 bg-rose-50/10'
                      : isHigh
                      ? 'border-l-4 border-l-amber-500 bg-amber-50/10'
                      : 'border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Subject, Category & Book */}
                  <td className="py-4 px-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/tickets/${t._id}`}
                          className="font-bold text-ink hover:text-brand-dark transition-colors line-clamp-1 text-sm"
                        >
                          {t.subject}
                        </Link>
                        {t.unreadByAdmin && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            New
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-blush px-2 py-0.5 text-[10px] font-semibold text-brand-dark border border-line">
                          {t.category}
                        </span>
                        {t.book && (
                          <span className="text-[11px] text-muted flex items-center gap-1">
                            • <Book className="h-3 w-3 text-subtle inline" /> {t.book.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Author Details with Avatar */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand/10 text-brand text-[11px] font-bold">
                        {authorInitial}
                      </div>
                      <div>
                        <div className="font-semibold text-ink">{t.author?.name || 'Author'}</div>
                        <div className="text-[11px] text-muted font-mono">{t.author?.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Priority & SLA */}
                  <td className="py-4 px-4">
                    <PriorityBadge priority={t.priority} size="sm" />
                  </td>

                  {/* Status & AI Triage */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={t.status} size="sm" />
                      {t.aiStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 border border-amber-200">
                          <Sparkles className="h-2.5 w-2.5 animate-spin" />
                          AI Triage
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Age */}
                  <td className="py-4 px-4">{formatAge(t.createdAt)}</td>

                  {/* Action Link */}
                  <td className="py-4 px-5 text-right">
                    <Link
                      to={`/admin/tickets/${t._id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-line-dark bg-white px-3 py-1.5 text-xs font-semibold text-ink-light shadow-2xs hover:border-brand/40 hover:bg-brand hover:text-white transition-all cursor-pointer"
                    >
                      <span>Review</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueueTable;
