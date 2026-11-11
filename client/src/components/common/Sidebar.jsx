import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  ChevronDown,
  LifeBuoy,
  LayoutDashboard,
  Book,
  Shield,
  User,
  Sparkles,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import SignOutModal from './SignOutModal.jsx';
import api from '../../services/api.js';
import { getSocket } from '../../services/socket.js';

const quickAccounts = [
  { name: 'Admin', email: 'admin@bookleaf.com', role: 'admin' },
  { name: 'Priya Sharma', email: 'priya.sharma@email.com', role: 'author' },
  { name: 'Rohit Kapoor', email: 'rohit.kapoor@email.com', role: 'author' },
  { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@email.com', role: 'author' },
];

export const Sidebar = () => {
  const { user, isAdmin, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadIds, setUnreadIds] = useState(new Set());

  // Track real-time unread messages across both authors and operations team
  useEffect(() => {
    if (!user) {
      setUnreadIds(new Set());
      return;
    }

    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const endpoint = isAdmin ? '/admin/tickets' : '/tickets/mine';
        const res = await api.get(endpoint);
        if (!isMounted) return;
        const list = res.data || [];
        const unreadSet = new Set(
          list
            .filter((t) => (isAdmin ? t.unreadByAdmin : t.unreadByAuthor))
            .map((t) => t._id)
        );
        setUnreadIds(unreadSet);
      } catch (err) {
        console.warn('Sidebar unread fetch:', err.message);
      }
    };

    fetchUnread();

    const socket = getSocket();

    const handleTicketUpdated = (ticket) => {
      if (!ticket?._id) return;
      const isUnread = isAdmin ? ticket.unreadByAdmin : ticket.unreadByAuthor;
      setUnreadIds((prev) => {
        const next = new Set(prev);
        if (isUnread) {
          next.add(ticket._id);
        } else {
          next.delete(ticket._id);
        }
        return next;
      });
    };

    const handleTicketRead = ({ ticketId }) => {
      if (!ticketId) return;
      setUnreadIds((prev) => {
        if (!prev.has(ticketId)) return prev;
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
    };

    const handleLocalRead = (e) => {
      const id = e?.detail?.id;
      if (!id) return;
      setUnreadIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };

    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('ticket:read', handleTicketRead);
    window.addEventListener('ticket:read', handleLocalRead);

    return () => {
      isMounted = false;
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('ticket:read', handleTicketRead);
      window.removeEventListener('ticket:read', handleLocalRead);
    };
  }, [user, isAdmin]);

  const unreadCount = unreadIds.size;

  const handleQuickSwitch = async (acc) => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      const pwd = acc.role === 'admin' ? 'admin123' : 'author123';
      const loggedUser = await login(acc.email, pwd);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/tickets');
      }
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
  };

  if (!user) return null;

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* Mobile Top Bar with Drawer Toggle */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface px-4 py-3 shadow-xs">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <span className="font-display font-extrabold text-ink text-base tracking-tight">BookLeaf</span>
            <span className="ml-1 rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-bold text-brand-dark">Hub</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line-dark text-ink hover:bg-blush-soft cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink/30 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar (Desktop) / Slide-over Drawer (Mobile) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-line bg-surface px-4 py-5 shadow-xs transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Area: Brand & Workspace Identity */}
        <div>
          <div className="flex items-center justify-between px-2 pb-4 border-b border-line">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white shadow-xs transition-transform group-hover:scale-105">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                    BookLeaf
                  </span>
                  <span className="rounded-md bg-brand-light px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-brand-dark">
                    Publishing
                  </span>
                </div>
                <div className="text-[11px] font-medium text-muted">Author Support Desk</div>
              </div>
            </Link>
          </div>

          {/* Quick Account Switcher */}
          <div className="relative mt-4">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-blush/40 px-3 py-2 text-xs font-semibold text-ink shadow-2xs hover:border-brand/40 hover:bg-blush transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand text-white text-[11px] font-bold">
                  {initial}
                </div>
                <span className="truncate">{user.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-brand-light px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-dark">
                  {user.role}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-subtle" />
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-line-dark bg-surface p-1.5 shadow-lg z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Switch Active Role
                </div>
                {quickAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickSwitch(acc)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      acc.email === user.email
                        ? 'bg-brand-light font-bold text-brand-dark'
                        : 'text-ink hover:bg-blush-soft'
                    }`}
                  >
                    <span>{acc.name}</span>
                    <span className="text-[10px] uppercase text-muted font-mono">{acc.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="mt-6 space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Workspace Menu
            </div>

            {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-light hover:bg-blush-soft'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Support Queue</span>
                </div>
                {unreadCount > 0 && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-white text-emerald-800'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {unreadCount}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  location.pathname.startsWith('/tickets')
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-light hover:bg-blush-soft'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LifeBuoy className="h-4 w-4" />
                  <span>Support Tickets</span>
                </div>
                {unreadCount > 0 && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      location.pathname.startsWith('/tickets')
                        ? 'bg-white text-emerald-800'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom Area: Realtime Status & Sign Out */}
        <div className="pt-4 border-t border-line space-y-3">
          {/* Socket status indicator */}
          <div className="flex items-center gap-2 rounded-xl bg-blush/60 px-3 py-2 text-[11px] font-medium text-emerald-800 border border-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Realtime Socket Active</span>
          </div>

          {/* User Sign Out Card */}
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 font-bold text-brand text-xs">
                {initial}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-ink truncate">{user.name}</div>
                <div className="text-[10px] text-muted truncate">{user.email}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSignOutModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-brand-light hover:text-brand-dark transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Sign Out Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        userName={user?.name}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={() => {
          setShowSignOutModal(false);
          logout();
        }}
      />
    </>
  );
};

export default Sidebar;
