import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

import RegistrationHeader from './components/RegistrationHeader';
import PersonalDetailsSection from './components/PersonalDetailsSection';
import AccountSecuritySection from './components/AccountSecuritySection';
import EmployeeVerificationSection from './components/EmployeeVerificationSection';
import ProgressIndicator from './components/ProgressIndicator';
import SecurityMessaging from './components/SecurityMessaging';

const Register = () => {
  const navigate = useNavigate();
  const { signUp, authError, clearError } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    phone: '',
    start_date: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false,
    dealershipCode: ''
  });

  const [errors, setErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Clear auth error when user makes changes
    if (authError) {
      clearError();
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Full name is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      if (!formData.employee_id.trim()) {
        newErrors.employee_id = 'Employee ID is required';
      }
      
      if (!formData.start_date) {
        newErrors.start_date = 'Start date is required';
      }
    }

    if (step === 2) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 3) {
      if (!formData.employee_id.trim()) {
        newErrors.employee_id = 'Employee ID is required';
      }
      
      if (!formData.dealershipCode.trim()) {
        newErrors.dealershipCode = 'Dealership Code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setShowValidation(true);
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      setShowValidation(false);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setShowValidation(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!validateStep(3)) {
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        full_name: formData.full_name,
        employee_id: formData.employee_id,
        phone: formData.phone,
        start_date: formData.start_date,
        role: 'member'
      };

      const result = await signUp(formData.email, formData.password, userData);
      
      if (result.success) {
        // Show success message and redirect
        alert('Registration successful! Please check your email to verify your account.');
        navigate('/login');
      }
    } catch (error) {
      // Error handling is managed by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = (step) => {
    if (step === 1) {
      return formData.full_name.trim() && 
             formData.email.trim() && 
             /\S+@\S+\.\S+/.test(formData.email) &&
             formData.employee_id.trim() && 
             formData.start_date;
    }
    if (step === 2) {
      return formData.password && 
             formData.password.length >= 8 && 
             formData.confirmPassword && 
             formData.password === formData.confirmPassword;
    }
    if (step === 3) {
      return formData.employee_id.trim() && 
             formData.dealershipCode.trim();
    }
    return false;
  };

  const steps = [
    { number: 1, title: 'Personal Details', description: 'Basic information' },
    { number: 2, title: 'Account Security', description: 'Password setup' },
    { number: 3, title: 'Verification', description: 'Terms & conditions' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="py-8">
        <div className="max-w-2xl mx-auto px-6">
          <RegistrationHeader />
          
          {/* Progress Indicator */}
          <ProgressIndicator 
            currentStep={currentStep}
            totalSteps={3}
            className="mb-8"
          />

          {/* Registration Form */}
          <div className="bg-card border border-border rounded-lg shadow-elevated p-8">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Personal Details */}
              {currentStep === 1 && (
                <PersonalDetailsSection
                  formData={formData}
                  handleChange={handleChange}
                  errors={showValidation ? errors : {}}
                />
              )}

              {/* Step 2: Account Security */}
              {currentStep === 2 && (
                <AccountSecuritySection
                  formData={formData}
                  handleChange={handleChange}
                  errors={showValidation ? errors : {}}
                />
              )}

              {/* Step 3: Employee Verification */}
              {currentStep === 3 && (
                <EmployeeVerificationSection
                  formData={formData}
                  handleChange={handleChange}
                  errors={showValidation ? errors : {}}
                />
              )}

              {/* Missing Data Alert */}
              {showValidation && Object.keys(errors).length > 0 && (
                <div className="mt-6 bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <svg className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-warning mb-1">Please complete all required fields:</p>
                      <ul className="text-sm text-warning/80 list-disc list-inside space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                          <li key={field}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {authError && (
                <div className="mt-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4 text-destructive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-destructive">{authError}</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                <div>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={isLoading}
                      iconName="ChevronLeft"
                      iconPosition="left"
                    >
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    disabled={isLoading}
                  >
                    Already have an account?
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleNext}
                      disabled={isLoading}
                      iconName="ChevronRight"
                      iconPosition="right"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="default"
                      loading={isLoading}
                      disabled={!isStepValid(3) || isLoading}
                      iconName="Check"
                      iconPosition="left"
                    >
                      Create Account
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Security Messaging */}
          <SecurityMessaging className="mt-6" />
        </div>
      </main>
    </div>
  );
};

export default Register;