import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const CustomReportBuilder = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    metrics: [],
    groupBy: [],
    sortBy: 'date_desc',
    format: 'pdf'
  });

  const availableMetrics = [
    { id: 'total_sales', label: 'Total Sales', category: 'Sales' },
    { id: 'sales_count', label: 'Number of Sales', category: 'Sales' },
    { id: 'avg_sale_price', label: 'Average Sale Price', category: 'Sales' },
    { id: 'commission_total', label: 'Total Commissions', category: 'Commission' },
    { id: 'commission_sale', label: 'Sale Commission', category: 'Commission' },
    { id: 'commission_accessories', label: 'Accessories Commission', category: 'Commission' },
    { id: 'commission_warranty', label: 'Warranty Commission', category: 'Commission' },
    { id: 'commission_service', label: 'Service Commission', category: 'Commission' },
    { id: 'spiff_bonus', label: 'SPIFF Bonuses', category: 'Commission' },
    { id: 'conversion_rate', label: 'Conversion Rate', category: 'Performance' },
    { id: 'goal_achievement', label: 'Goal Achievement %', category: 'Performance' },
    { id: 'streak_days', label: 'Sales Streak', category: 'Performance' }
  ];

  const groupByOptions = [
    { value: 'salesperson', label: 'Salesperson' },
    { value: 'date', label: 'Date' },
    { value: 'vehicle_type', label: 'Vehicle Type' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'team', label: 'Sales Team' }
  ];

  const sortByOptions = [
    { value: 'date_desc', label: 'Date (Newest First)' },
    { value: 'date_asc', label: 'Date (Oldest First)' },
    { value: 'commission_desc', label: 'Commission (Highest First)' },
    { value: 'commission_asc', label: 'Commission (Lowest First)' },
    { value: 'sales_desc', label: 'Sales Count (Highest First)' },
    { value: 'sales_asc', label: 'Sales Count (Lowest First)' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel (XLSX)' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' }
  ];

  const handleMetricToggle = (metricId) => {
    setReportConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(id => id !== metricId)
        : [...prev.metrics, metricId]
    }));
  };

  const handleGroupByToggle = (groupBy) => {
    setReportConfig(prev => ({
      ...prev,
      groupBy: prev.groupBy.includes(groupBy)
        ? prev.groupBy.filter(g => g !== groupBy)
        : [...prev.groupBy, groupBy]
    }));
  };

  const generateCustomReport = () => {
    console.log('Generating custom report with config:', reportConfig);
  };

  const saveTemplate = () => {
    console.log('Saving custom template:', reportConfig);
  };

  const metricsByCategory = availableMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <Icon name="Settings" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Custom Report Builder</h3>
          </div>
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={20} className="text-muted-foreground" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Report Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Report Name</label>
              <Input
                placeholder="Enter report name..."
                value={reportConfig.name}
                onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Export Format</label>
              <Select
                value={reportConfig.format}
                onChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                options={formatOptions}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
              placeholder="Brief description of this custom report..."
              value={reportConfig.description}
              onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Metrics Selection */}
          <div>
            <h4 className="text-md font-semibold text-foreground mb-4">Select Metrics to Include</h4>
            <div className="space-y-4">
              {Object.entries(metricsByCategory).map(([category, metrics]) => (
                <div key={category}>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">{category}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {metrics.map((metric) => (
                      <div key={metric.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={reportConfig.metrics.includes(metric.id)}
                          onChange={() => handleMetricToggle(metric.id)}
                        />
                        <label className="text-sm text-foreground">{metric.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group By Options */}
          <div>
            <h4 className="text-md font-semibold text-foreground mb-4">Group Data By</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {groupByOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    checked={reportConfig.groupBy.includes(option.value)}
                    onChange={() => handleGroupByToggle(option.value)}
                  />
                  <label className="text-sm text-foreground">{option.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
            <div className="max-w-md">
              <Select
                value={reportConfig.sortBy}
                onChange={(value) => setReportConfig(prev => ({ ...prev, sortBy: value }))}
                options={sortByOptions}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Info" size={16} />
              <span>{reportConfig.metrics.length} metrics selected</span>
              {reportConfig.groupBy.length > 0 && <span>• Grouped by {reportConfig.groupBy.length} dimension{reportConfig.groupBy.length > 1 ? 's' : ''}</span>}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={saveTemplate}
                className="px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md font-medium text-sm transition-colors"
                disabled={!reportConfig.name || reportConfig.metrics.length === 0}
              >
                Save as Template
              </button>
              <button
                onClick={generateCustomReport}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium text-sm transition-colors"
                disabled={reportConfig.metrics.length === 0}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomReportBuilder;