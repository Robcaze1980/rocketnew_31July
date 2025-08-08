import React from 'react';
import Select from '../../../components/ui/Select';

const TimeFilter = ({ selectedFilter, onFilterChange, loading = false }) => {
  const filterOptions = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'previous_month', label: 'Previous Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'this_year', label: 'This Year' }
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-muted rounded w-48"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-foreground">Time Period:</span>
      <Select
        value={selectedFilter}
        onValueChange={onFilterChange}
        options={filterOptions}
        className="w-48"
        disabled={loading}
      />
    </div>
  );
};

export default TimeFilter;
