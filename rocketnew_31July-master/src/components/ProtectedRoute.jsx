import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAccess } from '../hooks/useRoleAccess';

const ProtectedRoute = ({ children, requiredRole = null, fallback = null }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: roleLoading } = useRoleAccess();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto bg-card p-8 rounded-lg border border-border shadow-soft text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-9V4a2 2 0 00-2-2H7a2 2 0 00-2 2v4m0 0V6a2 2 0 012-2h10a2 2 0 012 2v2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8H5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Preview Mode</h2>
          <p className="text-muted-foreground mb-6">
            This feature requires authentication. Sign in to access your personalized dashboard and sales data.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto bg-card p-8 rounded-lg border border-border shadow-soft text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">
            This feature is only available to {requiredRole === 'admin' ? 'administrators' : 'managers and administrators'}.
            Contact your administrator if you need access.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;