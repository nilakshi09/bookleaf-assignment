import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Save,
  Clock,
  AlertTriangle,
  Book,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { playNotificationSound, flashTabTitle } from '../services/notifications.js';
import StatusBadge from '../components/common/StatusBadge.jsx';
import PriorityBadge from '../components/common/PriorityBadge.jsx';
import CategoryBadge from '../components/common/CategoryBadge.jsx';
import AIReplyBox from '../components/admin/AIReplyBox.jsx';
import InternalNotesCard from '../components/admin/InternalNotesCard.jsx';
import AdminConversation from '../components/admin/AdminConversation.jsx';

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export const AdminTicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Open');
  const [category, setCategory] = useState('General Inquiry');
  const [priority, setPriority] = useState('Medium');
  const [savingMeta, setSavingMeta] = useState(false);

  // Fetch ticket details & mark read
  useEffect(() => {
    let mounted = true;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/tickets/${id}`);
        if (mounted) {
          setTicket(res.data);
          setStatus(res.data.status);
          setCategory(res.data.category);
          setPriority(res.data.priority);
        }

        // Mark ticket read by staff and dispatch read event
        if (res.data.unreadByAdmin) {
          window.dispatchEvent(new CustomEvent('ticket:read', { detail: { id } }));
          await api.post(`/admin/tickets/${id}/read`);
        }
      } catch (err) {
        console.error('Failed to load ticket:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetail();

    // Socket.IO real-time listener for this ticket with alert
    const socket = getSocket();
    const handleTicketUpdated = (updated) => {
      if (updated._id === id) {
        setTicket((prev) => {
          if ((updated.replies?.length || 0) > (prev?.replies?.length || 0)) {
            playNotificationSound();
            flashTabTitle(`💬 New reply from ${updated.author?.name || 'Author'}`);
            toast(`New reply received from ${updated.author?.name || 'Author'}`, {
              icon: '💬',
            });
          }
          return updated;
        });

        setStatus(updated.status);
        setCategory(updated.category);
        setPriority(updated.priority);
      }
    };

    socket.on('ticket:updated', handleTicketUpdated);

    return () => {
      mounted = false;
      socket.off('ticket:updated', handleTicketUpdated);
    };
  }, [id]);

  const handleSaveMetadata = async () => {
    try {
      setSavingMeta(true);
      const res = await api.patch(`/admin/tickets/${id}`, {
        status,
        category,
        priority,
      });
      setTicket(res.data);
      toast.success('Ticket metadata updated');
    } catch (err) {
      console.error('Failed to update metadata:', err);
      toast.error('Failed to update metadata');
    } finally {
      setSavingMeta(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-6">
        <div className="card text-center py-12 px-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="mt-2 text-xs text-muted">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-page p-6">
        <div className="max-w-3xl mx-auto card text-center py-12">
          <h2 className="font-display text-lg font-bold text-ink">Ticket Not Found</h2>
          <Link to="/admin" className="btn-primary text-xs mt-4 inline-flex">
            Back to Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page pb-20">
      {/* Top Workspace Header Banner */}
      <div className="border-b border-line bg-surface px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-dark hover:underline mb-3 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Support Queue
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <CategoryBadge category={ticket.category} />
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {ticket.aiStatus === 'failed' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    Rule-Based Triage
                  </span>
                )}
              </div>
              <h1 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
                {ticket.subject}
              </h1>
            </div>

            <div className="text-right text-xs text-muted self-start">
              <span>Ticket ID: </span>
              <span className="font-mono text-ink font-semibold">#{ticket._id.slice(-8)}</span>
              <div className="mt-0.5 text-[11px]">
                Created: {new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Workspace Layout */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (2 spans): Conversation Thread & AI Reply Box */}
          <div className="lg:col-span-2 space-y-6">
            <AdminConversation ticket={ticket} />
            <AIReplyBox ticket={ticket} onUpdate={setTicket} />
          </div>

          {/* Right Sidebar (1 span): Metadata Controls, Author & Book Info, Internal Notes */}
          <div className="space-y-6">
            {/* Metadata Controls Card */}
            <div className="card border-line-dark bg-surface shadow-xs p-5">
              <h4 className="font-bold text-sm text-ink pb-3 border-b border-line">
                Ticket Controls
              </h4>

              <div className="mt-4 space-y-3.5 text-xs">
                {/* Status Dropdown */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input text-xs py-2 cursor-pointer font-semibold"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input text-xs py-2 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Dropdown */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input text-xs py-2 cursor-pointer font-semibold"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save button */}
                <button
                  type="button"
                  disabled={savingMeta}
                  onClick={handleSaveMetadata}
                  className="btn-secondary w-full text-xs py-2 mt-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingMeta ? 'Updating...' : 'Save Ticket Metadata'}
                </button>
              </div>
            </div>

            {/* Author & Book Details Card */}
            <div className="card border-line-dark bg-surface shadow-xs p-5">
              <h4 className="font-bold text-sm text-ink pb-3 border-b border-line flex items-center gap-2">
                <User className="h-4 w-4 text-brand" />
                Author & Book Details
              </h4>

              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Author Name</span>
                  <span className="font-semibold text-ink text-sm">{ticket.author?.name}</span>
                  <div className="text-muted font-mono text-[11px]">{ticket.author?.email}</div>
                  {ticket.author?.phone && (
                    <div className="text-muted text-[11px]">Phone: {ticket.author.phone}</div>
                  )}
                  {ticket.author?.city && (
                    <div className="text-muted text-[11px]">Location: {ticket.author.city}</div>
                  )}
                </div>

                {ticket.book ? (
                  <div className="pt-3 border-t border-line/70">
                    <span className="text-[10px] uppercase font-bold text-muted block">
                      Published Book
                    </span>
                    <span className="font-semibold text-ink">{ticket.book.title}</span>
                    <div className="text-muted font-mono text-[11px]">ISBN: {ticket.book.isbn}</div>

                    <div className="grid grid-cols-2 gap-2 mt-2 bg-blush/40 p-2.5 rounded-xl border border-line">
                      <div>
                        <span className="text-[10px] uppercase text-muted block">Copies Sold</span>
                        <span className="font-bold text-ink">{ticket.book.total_copies_sold || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted block">Unpaid Royalty</span>
                        <span className="font-bold text-ink">
                          Rs {(ticket.book.royalty_pending || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 text-muted italic">
                    No book attached to this inquiry (General / Account level).
                  </div>
                )}
              </div>
            </div>

            {/* Private Internal Notes Card */}
            <InternalNotesCard ticket={ticket} onUpdate={setTicket} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTicketDetail;
