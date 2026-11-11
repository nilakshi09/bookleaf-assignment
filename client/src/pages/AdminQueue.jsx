import React, { useState, useEffect } from 'react';
import { RefreshCw, LifeBuoy, AlertCircle, Filter, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { playNotificationSound, flashTabTitle } from '../services/notifications.js';
import QueueStats from '../components/admin/QueueStats.jsx';
import QueueFilters from '../components/admin/QueueFilters.jsx';
import QueueTable from '../components/admin/QueueTable.jsx';

export const AdminQueue = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    assignedTo: '',
    date: '',
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;
      if (filters.date) params.date = filters.date;

      const res = await api.get('/admin/tickets', { params });
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch admin queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  // Socket.IO real-time synchronization with sound, title & toast notifications
  useEffect(() => {
    const socket = getSocket();

    const handleTicketUpdated = (updated) => {
      setTickets((prev) => {
        const existing = prev.find((t) => t._id === updated._id);

        // Notify staff on incoming author messages or new tickets
        if (
          updated.unreadByAdmin &&
          (!existing || (existing.replies?.length || 0) < (updated.replies?.length || 0))
        ) {
          playNotificationSound();
          flashTabTitle(`🔔 New message: "${updated.subject}"`);
          toast(`New author message on "${updated.subject}"`, {
            icon: '🔔',
          });
        }

        if (existing) {
          return prev.map((t) => (t._id === updated._id ? updated : t));
        }
        return [updated, ...prev];
      });
    };

    const handleTicketClassified = (classified) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === classified._id ? classified : t))
      );
    };

    const handleTicketRead = ({ ticketId }) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, unreadByAdmin: false } : t))
      );
    };

    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('ticket:classified', handleTicketClassified);
    socket.on('ticket:read', handleTicketRead);

    return () => {
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('ticket:classified', handleTicketClassified);
      socket.off('ticket:read', handleTicketRead);
    };
  }, []);

  const handleResetFilters = () => {
    setFilters({
      status: '',
      category: '',
      priority: '',
      assignedTo: '',
      date: '',
    });
    setSearch('');
  };

  // Client-side text search across subject & author name
  const filteredTickets = tickets.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const subjectMatch = t.subject?.toLowerCase().includes(q);
    const authorMatch =
      t.author?.name?.toLowerCase().includes(q) || t.author?.email?.toLowerCase().includes(q);
    return subjectMatch || authorMatch;
  });

  const unreadCount = tickets.filter((t) => t.unreadByAdmin).length;

  return (
    <div className="min-h-screen bg-page pb-20">
      {/* Top Workspace Header Banner */}
      <div className="border-b border-line bg-surface px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark">
                  Operations Desk
                </span>
                <span className="text-subtle">•</span>
                <span className="text-[11px] font-semibold text-muted">BookLeaf Publishing</span>
              </div>
              <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl mt-0.5 flex flex-wrap items-center gap-2.5">
                <span>Support Ticket Queue</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {unreadCount} unread
                  </span>
                )}
              </h1>
              <p className="text-xs text-muted mt-1">
                Automated AI triage, SLA priority sorting, and policy-grounded author reply station.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchTickets}
              className="btn-secondary text-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Queue
            </button>
          </div>

          {/* Aggregate metric cards */}
          <div className="mt-6">
            <QueueStats tickets={tickets} />
          </div>
        </div>
      </div>

      {/* Main Table Body */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-6">
        {/* Filter Toolbar */}
        <QueueFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Queue Data Table */}
        {loading ? (
          <div className="card text-center py-16 border-line">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="mt-2 text-xs text-muted">Loading support queue...</p>
          </div>
        ) : (
          <QueueTable tickets={filteredTickets} />
        )}
      </div>
    </div>
  );
};

export default AdminQueue;
