import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Shield, User, ArrowRight, AlertCircle, Sparkles, Book, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { disconnectSocket } from '../services/socket.js';

const TEST_CREDENTIALS = [
  { role: 'Admin', name: 'Operations Desk', email: 'admin@bookleaf.com', pass: 'admin123', desc: 'SLA Triage & Policy Grounded Replies' },
  { role: 'Author', name: 'Priya Sharma', email: 'priya.sharma@email.com', pass: 'author123', desc: 'Poetry & Fiction Author' },
  { role: 'Author', name: 'Rohit Kapoor', email: 'rohit.kapoor@email.com', pass: 'author123', desc: 'Bestselling Non-Fiction Author' },
  { role: 'Author', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@email.com', pass: 'author123', desc: 'Short Stories & Anthology Writer' },
];

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Disconnect any stale socket connection on login page mount
  useEffect(() => {
    disconnectSocket();
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError('');
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/tickets');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = async (cred) => {
    setEmail(cred.email);
    setPassword(cred.pass);
    setError('');
    try {
      setLoading(true);
      const loggedUser = await login(cred.email, cred.pass);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/tickets');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-page">
      {/* Left Brand Showcase Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-line bg-blush/60 p-12 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

        {/* Brand identity */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-extrabold tracking-tight text-ink">
                BookLeaf
              </span>
              <span className="rounded-md bg-brand-light px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-dark">
                Publishing
              </span>
            </div>
            <div className="text-xs font-medium text-muted">Author Support & Operations Hub</div>
          </div>
        </div>

        {/* Hero Narrative */}
        <div className="max-w-md my-auto relative z-10 py-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-dark mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Direct Editorial & Royalties Desk
          </span>

          <h2 className="font-display text-3xl font-extrabold text-ink leading-tight">
            Where Every Author’s Journey Is Supported with Care.
          </h2>

          <p className="mt-4 text-sm text-ink-light leading-relaxed">
            Welcome to the official BookLeaf Author Portal. Track your book distribution, verify royalty transfers, and communicate directly with our publishing support team.
          </p>

          <div className="mt-8 space-y-3.5 text-xs text-ink-light">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Sub-second ticket dispatch with background AI categorization</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Policy-grounded draft answers reviewed by human staff</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Real-time socket notifications with live unread indicators</span>
            </div>
          </div>
        </div>

        {/* Bottom Guarantee */}
        <div className="text-xs text-muted relative z-10 pt-4 border-t border-line/70 flex items-center justify-between">
          <span>BookLeaf Publishing © {new Date().getFullYear()}</span>
          <span className="font-mono text-[11px]">v2.0 • Secure Session</span>
        </div>
      </div>

      {/* Right Login & Account Selection Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-sm mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              BookLeaf Support Hub
            </h1>
            <p className="mt-1 text-xs text-muted">
              Secure Author & Operational Management Console
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
              Sign In to Your Workspace
            </h3>
            <p className="text-xs text-muted mt-1">
              Enter your credentials below or use the 1-click test accounts.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="input"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-bold mt-2 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick 1-Click Test Accounts */}
          <div className="mt-8 pt-6 border-t border-line">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-dark mb-3">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span>1-Click Test Accounts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEST_CREDENTIALS.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => fillCredentials(c)}
                  className="rounded-xl border border-line bg-blush/40 p-2.5 text-left hover:border-brand/40 hover:bg-blush transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dark">
                      {c.role}
                    </span>
                    <span className="text-[10px] text-muted font-mono">{c.email.split('@')[0]}</span>
                  </div>
                  <div className="text-xs font-semibold text-ink group-hover:text-brand-dark truncate mt-0.5">
                    {c.name}
                  </div>
                  <div className="text-[10px] text-muted truncate mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
