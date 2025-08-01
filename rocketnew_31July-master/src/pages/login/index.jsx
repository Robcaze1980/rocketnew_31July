import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import SecurityBadges from './components/SecurityBadges';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Login Card */}
        <div className="bg-card border border-border rounded-lg shadow-elevated p-8">
          <LoginHeader />
          <LoginForm />
          <SecurityBadges />
        </div>
        
        {/* Simple Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} AutoSales Dashboard. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;