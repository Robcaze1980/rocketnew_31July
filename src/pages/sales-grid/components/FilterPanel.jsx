import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import salesService from '../../../utils/salesService';

const FilterPanel = ({ filters, onApplyFilters, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [salespersonOptions, setSalespersonOptions] = useState([
    { value: '', label: 'All Salespeople' }
  ]);
  const [loading, setLoading] = useState(false);

  // Fetch salespeople for filter options
  useEffect(() => {
    const fetchSalespeople = async () => {
      try {
        setLoading(true);
        const result = await salesService?.getSalespeople();
        if (result?.success) {
          const options = [
            { value: '', label: 'All Salespeople' },
            ...result?.data?.map(user => ({
              value: user?.id, // Use UUID as value
              label: user?.full_name
            }))
          ];
          setSalespersonOptions(options);
        } else {
          console.error('Failed to fetch salespeople:', result?.error);
        }
      } catch (error) {
        console.error('Error fetching salespeople:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalespeople();
  }, []);

  const handleFilterChange = (key, value) => {
    if (key === 'dateRange') {
      setLocalFilters(prev => ({
        ...prev,
        dateRange: { ...prev?.dateRange, ...value }
      }));
    } else {
      setLocalFilters(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: { start: '', end: '' },
      saleType: '',
      commissionStatus: '',
      salesperson: ''
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const saleTypeOptions = [
    { value: '', label: 'All Sale Types' },
    { value: 'new', label: 'New Vehicle' },
    { value: 'used', label: 'Used Vehicle' },
    { value: 'lease', label: 'Lease' }
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">Filter Sales</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          iconName="X"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Date Range */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Date Range
          </label>
          <div className="flex space-x-2">
            <Input
              type="date"
              value={localFilters?.dateRange?.start}
              onChange={(e) => handleFilterChange('dateRange', { start: e?.target?.value })}
              placeholder="Start date"
            />
            <Input
              type="date"
              value={localFilters?.dateRange?.end}
              onChange={(e) => handleFilterChange('dateRange', { end: e?.target?.value })}
              placeholder="End date"
            />
          </div>
        </div>

        {/* Sale Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Sale Type
          </label>
          <Select
            value={localFilters?.saleType}
            onValueChange={(value) => handleFilterChange('saleType', value)}
            options={saleTypeOptions}
          />
        </div>

        {/* Commission Status */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <Select
            value={localFilters?.commissionStatus}
            onValueChange={(value) => handleFilterChange('commissionStatus', value)}
            options={statusOptions}
          />
        </div>

        {/* Salesperson */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Salesperson
          </label>
          <Select
            value={localFilters?.salesperson}
            onValueChange={(value) => handleFilterChange('salesperson', value)}
            options={salespersonOptions}
            disabled={loading}
            placeholder={loading ? "Loading salespeople..." : "Select salesperson"}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={handleReset}
        >
          Reset Filters
        </Button>
        <Button
          onClick={handleApply}
          iconName="Filter"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
