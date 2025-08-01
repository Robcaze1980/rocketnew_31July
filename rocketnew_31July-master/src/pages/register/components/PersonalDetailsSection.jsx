import React from 'react';
import Input from '../../../components/ui/Input';

const PersonalDetailsSection = ({ formData, handleChange, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-2">
              Full Name *
            </label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="w-full"
            />
            {errors?.full_name && (
              <p className="mt-1 text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full"
            />
            {errors?.email && (
              <p className="mt-1 text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="employee_id" className="block text-sm font-medium text-foreground mb-2">
              Employee ID *
            </label>
            <Input
              id="employee_id"
              name="employee_id"
              type="text"
              value={formData.employee_id}
              onChange={handleChange}
              placeholder="Enter your employee ID"
              required
              className="w-full"
            />
            {errors?.employee_id && (
              <p className="mt-1 text-sm text-destructive">{errors.employee_id}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
              Phone Number
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-foreground mb-2">
              Start Date *
            </label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="w-full"
            />
            {errors?.start_date && (
              <p className="mt-1 text-sm text-destructive">{errors.start_date}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsSection;