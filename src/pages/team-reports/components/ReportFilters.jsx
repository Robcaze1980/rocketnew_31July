import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import teamReportsService from '../../../utils/teamReportsService';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const ReportFilters = ({ onFiltersChange }) => {
  const { userProfile } = useAuth();
  const [filters, setFilters] = useState({
    dateRange: 'last_30_days',
    salesTeam: 'all',
    salesperson: 'all',
    vehicleCategory: 'all',
    commissionType: 'all'
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [salesTeams, setSalesTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const vehicleCategoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'new', label: 'New Vehicles' },
    { value: 'used', label: 'Used Vehicles' },
    { value: 'certified', label: 'Certified Pre-Owned' }
  ];

  const commissionTypeOptions = [
    { value: 'all', label: 'All Commission Types' },
    { value: 'sale', label: 'Sale Commission' },
    { value: 'accessories', label: 'Accessories Commission' },
    { value: 'warranty', label: 'Warranty Commission' },
    { value: 'service', label: 'Service Commission' },
    { value: 'spiff', label: 'SPIFF Bonuses' }
  ];

  // Fetch team members and sales teams on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!userProfile?.id) return;

      try {
        setLoading(true);

        // Fetch team members
        const membersResult = await teamReportsService.getTeamMembersForFilters(userProfile.id);
        if (membersResult.success) {
          const memberOptions = [
            { value: 'all', label: 'All Salespeople' },
            ...membersResult.data.map(member => ({
              value: member.id,
              label: member.full_name
            }))
          ];
          setTeamMembers(memberOptions);
        }

        // Fetch sales teams
        const teamsResult = await teamReportsService.getSalesTeamsForFilters(userProfile.id);
        if (teamsResult.success) {
          const teamOptions = [
            { value: 'all', label: 'All Teams' },
            ...teamsResult.data
          ];
          setSalesTeams(teamOptions);
        }

      } catch (error) {
        console.log('Error fetching filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, [userProfile?.id]);

  // Notify parent component when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Immediately notify parent of filter changes
    if (onFiltersChange) {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateRange: 'last_30_days',
      salesTeam: 'all',
      salesperson: 'all',
      vehicleCategory: 'all',
      commissionType: 'all'
    };
    setFilters(clearedFilters);
  };

  // Get active filter labels for summary
  const getActiveFiltersSummary = () => {
    const activeFilters = [];
    
    const dateRangeLabel = dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label;
    if (dateRangeLabel) activeFilters.push(dateRangeLabel);
    
    if (filters.salesTeam !== 'all') {
      const teamLabel = salesTeams.find(opt => opt.value === filters.salesTeam)?.label;
      if (teamLabel) activeFilters.push(teamLabel);
    }
    
    if (filters.salesperson !== 'all') {
      const personLabel = teamMembers.find(opt => opt.value === filters.salesperson)?.label;
      if (personLabel) activeFilters.push(personLabel);
    }
    
    if (filters.vehicleCategory !== 'all') {
      const categoryLabel = vehicleCategoryOptions.find(opt => opt.value === filters.vehicleCategory)?.label;
      if (categoryLabel) activeFilters.push(categoryLabel);
    }
    
    if (filters.commissionType !== 'all') {
      const commissionLabel = commissionTypeOptions.find(opt => opt.value === filters.commissionType)?.label;
      if (commissionLabel) activeFilters.push(commissionLabel);
    }

    return activeFilters.join(' • ');
  };

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Icon name="Filter" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Report Filters</h3>
          </div>
          <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Report Filters</h3>
        </div>
        <button
          onClick={clearFilters}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear All Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
          <Select
            value={filters.dateRange}
            onChange={(value) => handleFilterChange('dateRange', value)}
            options={dateRangeOptions}
          />
        </div>

        {/* Sales Team Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Sales Team</label>
          <Select
            value={filters.salesTeam}
            onChange={(value) => handleFilterChange('salesTeam', value)}
            options={salesTeams}
          />
        </div>

        {/* Salesperson Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Salesperson</label>
          <Select
            value={filters.salesperson}
            onChange={(value) => handleFilterChange('salesperson', value)}
            options={teamMembers}
          />
        </div>

        {/* Vehicle Category Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Vehicle Category</label>
          <Select
            value={filters.vehicleCategory}
            onChange={(value) => handleFilterChange('vehicleCategory', value)}
            options={vehicleCategoryOptions}
          />
        </div>

        {/* Commission Type Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Commission Type</label>
          <Select
            value={filters.commissionType}
            onChange={(value) => handleFilterChange('commissionType', value)}
            options={commissionTypeOptions}
          />
        </div>
      </div>

      {/* Custom Date Range */}
      {filters.dateRange === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
            <Input 
              type="date" 
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
            <Input 
              type="date" 
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="Info" size={16} />
          <span>
            {getActiveFiltersSummary() || 'Showing data for: Last 30 Days • All Teams • All Salespeople'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
