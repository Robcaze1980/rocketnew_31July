import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const PersonalInfoForm = ({ profileData, onSave, isUpdating }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    start_date: '',
    role: 'member'
  });

  // Update form data when profileData changes
  useEffect(() => {
    if (profileData) {
      setFormData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        employee_id: profileData.employee_id || '',
        start_date: profileData.start_date || '',
        role: profileData.role || 'member'
      });
    }
  }, [profileData]);

  const roleOptions = [
    { value: 'member', label: 'Sales Representative' },
    { value: 'manager', label: 'Sales Manager' },
    { value: 'admin', label: 'Administrator' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="User" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            disabled
            className="opacity-60"
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />

          <Input
            label="Employee ID"
            type="text"
            placeholder="Enter your employee ID"
            value={formData.employee_id}
            onChange={(e) => handleChange('employee_id', e.target.value)}
          />

          <Input
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
          />

          <Select
            label="Role"
            placeholder="Select role"
            options={roleOptions}
            value={formData.role}
            onChange={(value) => handleChange('role', value)}
            disabled={profileData?.role === 'admin'} // Prevent admins from changing their own role
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            iconName="Save"
            iconPosition="left"
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfoForm;