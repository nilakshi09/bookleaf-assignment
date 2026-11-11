import React from 'react';
import { Filter, X, Search, Calendar, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['all', 'Open', 'In Progress', 'Resolved', 'Closed'];

export const QueueFilters = ({ filters, onChange, onReset, search, onSearchChange }) => {
  const hasActiveFilters = Boolean(
    filters.status ||
    filters.category ||
    filters.priority ||
    filters.assignedTo ||
    filters.date ||
    search
  );

  return (
    <div className="card border-line bg-surface shadow-xs space-y-4">
      {/* Top row: Status Tabs & Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUSES.map((st) => {
            const isActive = (filters.status || 'all') === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => onChange({ ...filters, status: st === 'all' ? '' : st })}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface border border-line text-ink-light hover:bg-blush-soft'
                }`}
              >
                {st === 'all' ? 'All Queue' : st}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search author or inquiry..."
            className="input pl-9 text-xs py-2"
          />
        </div>
      </div>

      {/* Bottom Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-line/70">
        {/* Category */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="input text-xs py-2 cursor-pointer"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
            Priority SLA
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) => onChange({ ...filters, priority: e.target.value })}
            className="input text-xs py-2 cursor-pointer"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Assignment */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
            Assignment
          </label>
          <select
            value={filters.assignedTo || ''}
            onChange={(e) => onChange({ ...filters, assignedTo: e.target.value })}
            className="input text-xs py-2 cursor-pointer"
          >
            <option value="">All Inquiries</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned Only</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
            Date (IST)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filters.date || ''}
              onChange={(e) => onChange({ ...filters, date: e.target.value })}
              className="input text-xs py-1.5"
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="btn-secondary px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 cursor-pointer"
                title="Reset all filters"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueFilters;
