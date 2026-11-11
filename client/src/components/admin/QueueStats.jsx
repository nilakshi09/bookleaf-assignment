import React from 'react';
import { AlertCircle, Clock, CheckCircle2, UserX, Inbox, Zap } from 'lucide-react';

export const QueueStats = ({ tickets = [] }) => {
  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const criticalCount = tickets.filter(
    (t) => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed'
  ).length;
  const unassignedCount = tickets.filter(
    (t) => !t.assignedTo && t.status !== 'Resolved' && t.status !== 'Closed'
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Open Tickets */}
      <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4 transition-all hover:bg-sky-50 hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
            Open Queue
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Inbox className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-sky-950">{openCount}</div>
        <div className="mt-1 text-[11px] text-sky-700 font-medium">Awaiting first response</div>
      </div>

      {/* In Progress */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 transition-all hover:bg-amber-50 hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            In Progress
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-amber-950">{inProgressCount}</div>
        <div className="mt-1 text-[11px] text-amber-800 font-medium">Under active investigation</div>
      </div>

      {/* Critical SLA */}
      <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 transition-all hover:bg-rose-50 hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
            Critical Urgency
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-rose-950">{criticalCount}</div>
        <div className="mt-1 text-[11px] text-rose-700 font-medium">Immediate SLA escalation</div>
      </div>

      {/* Unassigned */}
      <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 transition-all hover:bg-indigo-50 hover:shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
            Unassigned
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <UserX className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-indigo-950">{unassignedCount}</div>
        <div className="mt-1 text-[11px] text-indigo-700 font-medium">Available for claiming</div>
      </div>
    </div>
  );
};

export default QueueStats;
