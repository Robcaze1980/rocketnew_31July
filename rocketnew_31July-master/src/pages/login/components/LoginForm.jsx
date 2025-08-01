import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const LoginForm = () => {
  const navigate = useNavigate();
  const { signIn, authError, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any existing errors when user starts typing
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      // Error handling is managed by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Email Address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
          disabled={isLoading}
          className="w-full"
        />
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            disabled={isLoading}
            className="w-full pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            {showPassword ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414l-2.122 2.122m2.122-2.122C9.9 8.464 10.9 8 12 8c2.12 0 3.879 1.168 4.8 2.9m-4.8 6.1c-2.12 0-3.879-1.168-4.8-2.9" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {authError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-destructive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-destructive">{authError}</p>
          </div>
        </div>
      )}

      {/* Forgot Password */}
      <div className="text-right">
        <button
          type="button"
          className="text-sm text-primary hover:text-primary/80 font-medium"
          disabled={isLoading}
          onClick={() => {
            // For now, just show an alert. In production, implement proper password reset
            alert('Password reset functionality will be available soon. Please contact your administrator.');
          }}
        >
          Forgot your password?
        </button>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        loading={isLoading}
        disabled={!formData.email || !formData.password}
        className="w-full"
      >
        Sign In
      </Button>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Need an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-primary hover:text-primary/80 font-medium"
            disabled={isLoading}
          >
            Register here
          </button>
        </p>
      </div>

      {/* Development Credentials */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-muted">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Development Credentials:</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p><strong>Admin:</strong> admin@dealership.com / admin123</p>
          <p><strong>User:</strong> john.doe@dealership.com / password123</p>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;