import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressIndicator = ({ currentStep = 1, totalSteps = 3, completedSteps = [] }) => {
  const steps = [
    { id: 1, label: 'Employee Verification', icon: 'UserCheck' },
    { id: 2, label: 'Personal Details', icon: 'User' },
    { id: 3, label: 'Account Security', icon: 'Shield' }
  ];

  // Ensure completedSteps is always an array and derive completed steps from currentStep if needed
  const safeCompletedSteps = Array.isArray(completedSteps) ? completedSteps : [];
  const derivedCompletedSteps = currentStep > 1 ? 
    Array.from({ length: currentStep - 1 }, (_, index) => index + 1) : [];
  const finalCompletedSteps = safeCompletedSteps.length > 0 ? safeCompletedSteps : derivedCompletedSteps;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-smooth ${
                finalCompletedSteps.includes(step.id)
                  ? 'bg-success border-success text-white'
                  : currentStep === step.id
                  ? 'bg-primary border-primary text-white' :'bg-muted border-border text-muted-foreground'
              }`}>
                {finalCompletedSteps.includes(step.id) ? (
                  <Icon name="Check" size={16} />
                ) : (
                  <Icon name={step.icon} size={16} />
                )}
              </div>
              <span className={`text-xs mt-2 text-center transition-smooth ${
                currentStep === step.id ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-smooth ${
                finalCompletedSteps.includes(step.id) ? 'bg-success' : 'bg-border'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );
};

export default ProgressIndicator;