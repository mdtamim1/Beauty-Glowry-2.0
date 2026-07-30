import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, adminOnly = false, customerOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '20px',
        background: 'var(--bg-primary)',
        color: 'var(--dark-text)'
      }}>
        <Shield size={64} />
        <Loader2 size={32} className="animate-spin" />
        <p style={{ fontWeight: 600, fontSize: '18px' }}>Accessing Portal...</p>
      </div>
    );
  }

  // Password-free Admin Access: If adminOnly is true, bypass login requirement completely
  if (adminOnly) {
    return children;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
