import React, { useState, useEffect } from 'react';
import {
  Plus,
  LifeBuoy,
  Book,
  Sparkles,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { playNotificationSound, flashTabTitle } from '../services/notifications.js';
import AuthorTicketCard from '../components/author/AuthorTicketCard.jsx';
import CreateTicketModal from '../components/author/CreateTicketModal.jsx';

export const AuthorPortal = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedBookId, setPreselectedBookId] = useState('');

  // Active view tab: 'tickets' or 'books'
  const [activeTab, setActiveTab] = useState('tickets');
  const [ticketFilter, setTicketFilter] = useState('all'); // 'all' | 'unread' | 'open' | 'resolved'
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch author's books and existing tickets
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [booksRes, ticketsRes] = await Promise.all([
          api.get('/books'),
          api.get('/tickets/mine'),
        ]);
        if (mounted) {
          setBooks(booksRes.data || []);
          setTickets(ticketsRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load author data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    // Setup Socket.IO listener for live ticket updates & sound/title alerts
    const socket = getSocket();
    const handleTicketUpdated = (updatedTicket) => {
      setTickets((prev) => {
        const existing = prev.find((t) => t._id === updatedTicket._id);

        // Notify author with chime, tab title, and toast when support sends a new reply
        if (
          updatedTicket.unreadByAuthor &&
          (!existing || (existing.replies?.length || 0) < (updatedTicket.replies?.length || 0))
        ) {
          playNotificationSound();
          flashTabTitle(`💬 New reply from Support on "${updatedTicket.subject}"`);
          toast(`New reply from Support on "${updatedTicket.subject}"`, {
            icon: '💬',
          });
        }

        if (existing) {
          return prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t));
        }
        return [updatedTicket, ...prev];
      });
    };

    const handleTicketRead = ({ ticketId }) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, unreadByAuthor: false } : t))
      );
    };

    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('ticket:read', handleTicketRead);

    return () => {
      mounted = false;
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('ticket:read', handleTicketRead);
    };
  }, []);

  const handleTicketCreated = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    toast.success('Ticket submitted successfully! AI triage initiated.');
    setActiveTab('tickets');
  };

  const handleTicketUpdate = (updated) => {
    setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  const openModalWithBook = (bookId) => {
    setPreselectedBookId(bookId);
    setIsModalOpen(true);
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Author';
  const unreadCount = tickets.filter((t) => t.unreadByAuthor).length;
  const openCount = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  const totalCopiesSold = books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0);
  const totalRoyalties = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);

  // Filter tickets according to active filter and search query
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === 'unread' && !t.unreadByAuthor) return false;
    if (ticketFilter === 'open' && t.status !== 'Open' && t.status !== 'In Progress') return false;
    if (ticketFilter === 'resolved' && t.status !== 'Resolved' && t.status !== 'Closed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const subjectMatch = t.subject?.toLowerCase().includes(q);
      const bookMatch = t.book?.title?.toLowerCase().includes(q);
      return subjectMatch || bookMatch;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-page pb-20">
      {/* Top Workspace Banner */}
      <div className="border-b border-line bg-surface px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark">
                  Author Workspace
                </span>
                <span className="text-subtle">•</span>
                <span className="text-[11px] font-semibold text-muted">BookLeaf Publishing</span>
              </div>
              <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl mt-0.5">
                Welcome back, {firstName}!
              </h1>
              <p className="text-xs text-muted mt-1">
                Manage your book distribution, royalty tracking, and connect directly with BookLeaf Support.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPreselectedBookId('');
                setIsModalOpen(true);
              }}
              className="btn-primary text-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Raise Support Ticket
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="rounded-2xl border border-line bg-blush/40 p-4 transition-all hover:border-brand/30">
              <div className="flex items-center justify-between text-muted text-[11px] font-bold uppercase tracking-wider">
                <span>Published Books</span>
                <Book className="h-4 w-4 text-brand" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-ink">{books.length}</div>
            </div>

            <div className="rounded-2xl border border-line bg-blush/40 p-4 transition-all hover:border-brand/30">
              <div className="flex items-center justify-between text-muted text-[11px] font-bold uppercase tracking-wider">
                <span>Copies Sold</span>
                <TrendingUp className="h-4 w-4 text-brand" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-ink">{totalCopiesSold.toLocaleString()}</div>
            </div>

            <div className="rounded-2xl border border-line bg-blush/40 p-4 transition-all hover:border-brand/30">
              <div className="flex items-center justify-between text-muted text-[11px] font-bold uppercase tracking-wider">
                <span>Pending Royalty</span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-ink">₹{totalRoyalties.toLocaleString()}</div>
            </div>

            <div className="rounded-2xl border border-line bg-blush/40 p-4 transition-all hover:border-brand/30">
              <div className="flex items-center justify-between text-muted text-[11px] font-bold uppercase tracking-wider">
                <span>Support Tickets</span>
                <LifeBuoy className="h-4 w-4 text-brand" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-extrabold text-ink">{tickets.length}</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {unreadCount} unread
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {/* Workspace Tab Switcher */}
        <div className="flex items-center gap-2 pb-4 border-b border-line mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-surface border border-line text-ink-light hover:bg-blush-soft'
            }`}
          >
            <LifeBuoy className="h-4 w-4" />
            <span>Support Tickets ({tickets.length})</span>
            {unreadCount > 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === 'tickets' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('books')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'books'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-surface border border-line text-ink-light hover:bg-blush-soft'
            }`}
          >
            <Book className="h-4 w-4" />
            <span>Published Books ({books.length})</span>
          </button>
        </div>

        {/* TAB 1: Support Tickets Console */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-line">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'all', label: 'All Tickets', count: tickets.length },
                  { key: 'unread', label: 'Unread Replies', count: unreadCount, isGreen: true },
                  { key: 'open', label: 'Active', count: openCount },
                  { key: 'resolved', label: 'Resolved', count: resolvedCount },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setTicketFilter(f.key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      ticketFilter === f.key
                        ? 'bg-brand-light font-bold text-brand-dark border border-brand/30'
                        : 'text-muted hover:bg-blush-soft hover:text-ink'
                    }`}
                  >
                    {f.isGreen && f.count > 0 && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <span>{f.label}</span>
                    <span className="rounded-md bg-white px-1.5 py-0.2 text-[10px] font-bold text-muted border border-line">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-subtle" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your tickets..."
                  className="input pl-9 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Tickets Feed */}
            {loading ? (
              <div className="card text-center py-16 border-line">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <p className="mt-2 text-xs text-muted">Loading your tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="card text-center py-16 border-line">
                <LifeBuoy className="mx-auto h-10 w-10 text-subtle mb-3" />
                <h3 className="font-display text-base font-bold text-ink">No tickets found</h3>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? 'No tickets match your search query.'
                    : 'Have questions about your publishing contract, distribution, or royalty payout? Open a ticket to reach our team.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPreselectedBookId('');
                    setIsModalOpen(true);
                  }}
                  className="btn-secondary text-xs mt-4 inline-flex"
                >
                  Raise Support Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((t) => (
                  <AuthorTicketCard
                    key={t._id}
                    ticket={t}
                    onUpdate={handleTicketUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Published Books & Royalty Statements */}
        {activeTab === 'books' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Your Publications</h3>
                <p className="text-xs text-muted mt-0.5">
                  Real-time sales, distribution tracking, and pending royalty balances.
                </p>
              </div>
            </div>

            {books.length === 0 ? (
              <div className="card text-center py-16 border-line">
                <Book className="mx-auto h-10 w-10 text-subtle mb-3" />
                <h3 className="font-display text-base font-bold text-ink">No books registered yet</h3>
                <p className="text-xs text-muted mt-1">
                  Once your manuscript is published with BookLeaf, your books and sales will show up here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.map((b) => (
                  <div
                    key={b._id}
                    className="card border-line hover:border-brand/40 bg-surface shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-line/70">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dark">
                            Registered Work
                          </span>
                          <h4 className="font-display text-base font-bold text-ink mt-0.5">{b.title}</h4>
                        </div>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Active
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-muted">
                          <span>ISBN Identifier:</span>
                          <span className="font-mono text-ink font-semibold">{b.isbn}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted">
                          <span>Retail Price:</span>
                          <span className="text-ink font-semibold">₹{b.price}</span>
                        </div>
                      </div>

                      {/* Sales & Royalty Pill Box */}
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-blush/50 p-3 border border-line">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted block">Copies Sold</span>
                          <span className="text-lg font-extrabold text-ink">{b.total_copies_sold || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted block">Unpaid Royalty</span>
                          <span className="text-lg font-extrabold text-brand-dark">
                            ₹{(b.royalty_pending || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-line/70 flex justify-end">
                      <button
                        type="button"
                        onClick={() => openModalWithBook(b._id)}
                        className="btn-ghost text-xs text-brand-dark hover:bg-brand-light font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Need Help With This Book?</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={books}
        initialBookId={preselectedBookId}
        onCreated={handleTicketCreated}
      />
    </div>
  );
};

export default AuthorPortal;
