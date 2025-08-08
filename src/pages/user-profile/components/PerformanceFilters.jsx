import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import 'react-datepicker/dist/react-datepicker.css';

const PerformanceFilters = ({ onFilterChange, currentFilters }) => {
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(currentFilters.startDate);
  const [tempEndDate, setTempEndDate] = useState(currentFilters.endDate);

  const quickFilters = [
    {
      id: 'this_month',
      label: 'This Month',
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    },
    {
      id: 'last_month',
      label: 'Last Month',
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfMonth(subMonths(new Date(), 1))
    },
    {
      id: 'last_3_months',
      label: 'Last 3 Months',
      startDate: startOfMonth(subMonths(new Date(), 2)),
      endDate: endOfMonth(new Date())
    },
    {
      id: 'last_6_months',
      label: 'Last 6 Months',
      startDate: startOfMonth(subMonths(new Date(), 5)),
      endDate: endOfMonth(new Date())
    },
    {
      id: 'this_year',
      label: 'This Year',
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date())
    },
    {
      id: 'last_year',
      label: 'Last Year',
      startDate: startOfYear(subYears(new Date(), 1)),
      endDate: endOfYear(subYears(new Date(), 1))
    }
  ];

  const handleQuickFilter = (filter) => {
    onFilterChange({
      ...currentFilters,
      startDate: filter.startDate,
      endDate: filter.endDate,
      selectedFilter: filter.id
    });
    setShowCustomDate(false);
  };

  const handleCustomDateApply = () => {
    if (tempStartDate && tempEndDate) {
      onFilterChange({
        ...currentFilters,
        startDate: tempStartDate,
        endDate: tempEndDate,
        selectedFilter: 'custom'
      });
      setShowCustomDate(false);
    }
  };

  const handleComparisonToggle = () => {
    onFilterChange({
      ...currentFilters,
      comparisonMode: !currentFilters.comparisonMode
    });
  };

  const handleSourceFilter = (sources) => {
    onFilterChange({
      ...currentFilters,
      commissionSources: sources
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Time Period & Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleComparisonToggle}
          className={currentFilters.comparisonMode ? 'bg-primary/10 border-primary text-primary' : ''}
        >
          <Icon name="GitCompare" size={16} className="mr-2" />
          Compare Periods
        </Button>
      </div>

      {/* Quick Filter Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {quickFilters.map((filter) => (
          <Button
            key={filter.id}
            variant={currentFilters.selectedFilter === filter.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuickFilter(filter)}
            className="text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Range */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomDate(!showCustomDate)}
            className={showCustomDate ? 'bg-primary/10 border-primary text-primary' : ''}
          >
            <Icon name="Calendar" size={16} className="mr-2" />
            Custom Range
          </Button>

          {showCustomDate && (
            <div className="flex items-center space-x-2">
              <DatePicker
                selected={tempStartDate}
                onChange={setTempStartDate}
                selectsStart
                startDate={tempStartDate}
                endDate={tempEndDate}
                placeholderText="Start Date"
                className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-foreground"
                maxDate={new Date()}
              />
              <span className="text-muted-foreground">to</span>
              <DatePicker
                selected={tempEndDate}
                onChange={setTempEndDate}
                selectsEnd
                startDate={tempStartDate}
                endDate={tempEndDate}
                minDate={tempStartDate}
                placeholderText="End Date"
                className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-foreground"
                maxDate={new Date()}
              />
              <Button
                size="sm"
                onClick={handleCustomDateApply}
                disabled={!tempStartDate || !tempEndDate}
              >
                Apply
              </Button>
            </div>
          )}
        </div>

        {/* Commission Source Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Commission Sources:</span>
          <Select
            value={currentFilters.commissionSources}
            onValueChange={handleSourceFilter}
            multiple
            placeholder="All Sources"
            className="w-48"
          >
            <option value="car_sales">Car Sales</option>
            <option value="warranties">Warranties</option>
            <option value="maintenance">Maintenance</option>
            <option value="accessories">Accessories</option>
            <option value="spiff">SPIFF Bonuses</option>
          </Select>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Period: {currentFilters.startDate?.toLocaleDateString()} - {currentFilters.endDate?.toLocaleDateString()}
          </span>
          {currentFilters.comparisonMode && (
            <span className="flex items-center">
              <Icon name="GitCompare" size={14} className="mr-1" />
              Comparison mode enabled
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceFilters;