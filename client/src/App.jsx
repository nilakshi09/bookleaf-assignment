import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import Login from './pages/Login.jsx';
import AuthorPortal from './pages/AuthorPortal.jsx';
import AdminQueue from './pages/AdminQueue.jsx';
import AdminTicketDetail from './pages/AdminTicketDetail.jsx';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/tickets'} replace />;
  }

  return children;
};

export const App = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-page">
      {!isLoginPage && <Sidebar />}

      <div className={`flex-1 flex flex-col ${!isLoginPage ? 'lg:pl-72' : ''}`}>
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to={user?.role === 'admin' ? '/admin' : '/tickets'} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute requiredRole="author">
                  <AuthorPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tickets/:id"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTicketDetail />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Modern bottom-right toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4500,
          style: {
            background: '#1B1E26',
            color: '#FFFFFF',
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '13px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
    </div>
  );
};

export default App;
