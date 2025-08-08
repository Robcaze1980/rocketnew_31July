import React, { useState } from 'react';
import Input from '../../../components/ui/Input';

const AccountSecuritySection = ({ formData, handleChange, errors }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    let feedback = [];

    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[A-Z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/\d/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One number');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('One special character');
    }

    return { strength, feedback };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Account Security</h3>
        
        <div className="space-y-4">
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password *
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
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

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${strengthColors[passwordStrength.strength - 1] || 'bg-gray-300'}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {strengthLabels[passwordStrength.strength - 1] || 'Very Weak'}
                  </span>
                </div>
                
                {passwordStrength.feedback.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span>Missing: {passwordStrength.feedback.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {errors?.password && (
              <p className="mt-1 text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
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

            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className="mt-1">
                {formData.password === formData.confirmPassword ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs">Passwords match</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-destructive">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-xs">Passwords do not match</span>
                  </div>
                )}
              </div>
            )}

            {errors?.confirmPassword && (
              <p className="mt-1 text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSecuritySection;