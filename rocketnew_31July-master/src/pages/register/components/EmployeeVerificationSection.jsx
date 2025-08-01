import React from 'react';
import Input from '../../../components/ui/Input';

const EmployeeVerificationSection = ({ 
  formData, 
  errors, 
  handleChange, 
  isValidatingEmployeeId 
}) => {
  const handleInputChange = (fieldName, value) => {
    const syntheticEvent = {
      target: {
        name: fieldName,
        value: value
      }
    };
    handleChange(syntheticEvent);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Employee Verification</h3>
        <p className="text-sm text-muted-foreground">
          Verify your employment credentials to create your account
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Employee ID"
          type="text"
          placeholder="Enter your employee ID"
          value={formData.employee_id}
          onChange={(e) => handleInputChange('employee_id', e.target.value)}
          error={errors.employee_id}
          required
          disabled={isValidatingEmployeeId}
          description="Your unique employee identification number"
        />

        <Input
          label="Dealership Code"
          type="text"
          placeholder="Enter dealership code"
          value={formData.dealershipCode}
          onChange={(e) => handleInputChange('dealershipCode', e.target.value)}
          error={errors.dealershipCode}
          required
          description="Your dealership's identification code"
        />
      </div>

      {isValidatingEmployeeId && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Validating employee credentials...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeVerificationSection;