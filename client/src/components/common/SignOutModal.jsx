import React, { useEffect } from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

export const SignOutModal = ({ isOpen, onClose, onConfirm, userName }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-xs animate-fade-in-up">
      <div
        className="relative w-full max-w-sm rounded-2xl border border-line-dark bg-surface p-6 shadow-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-blush-soft hover:text-ink cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand shadow-xs mb-3">
            <LogOut className="h-6 w-6" />
          </div>

          <h3 className="font-display text-lg font-bold text-ink">Sign Out</h3>
          <p className="mt-1.5 text-xs text-muted leading-relaxed max-w-xs">
            Are you sure you want to log out{userName ? `, ${userName}` : ''}? You will need to sign back in to access your tickets.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full text-xs py-2.5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignOutModal;
