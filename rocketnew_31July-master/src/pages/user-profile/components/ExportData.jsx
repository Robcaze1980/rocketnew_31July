import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExportData = () => {
  const [exportType, setExportType] = useState('sales');
  const [dateRange, setDateRange] = useState('last_month');
  const [format, setFormat] = useState('csv');
  const [includeCommissions, setIncludeCommissions] = useState(true);
  const [includeCustomerData, setIncludeCustomerData] = useState(false);
  const [includeVehicleDetails, setIncludeVehicleDetails] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const exportTypeOptions = [
    { value: 'sales', label: 'Sales History' },
    { value: 'commissions', label: 'Commission Reports' },
    { value: 'performance', label: 'Performance Data' },
    { value: 'all', label: 'Complete Profile Data' }
  ];

  const dateRangeOptions = [
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'all_time', label: 'All Time' }
  ];

  const formatOptions = [
    { value: 'csv', label: 'CSV (Excel Compatible)' },
    { value: 'pdf', label: 'PDF Report' },
    { value: 'json', label: 'JSON Data' }
  ];

  const exportHistory = [
    {
      id: 1,
      type: 'Sales History',
      dateRange: 'Last Month',
      format: 'CSV',
      exportedAt: '2025-01-25 14:30:00',
      fileSize: '2.3 MB',
      status: 'completed'
    },
    {
      id: 2,
      type: 'Commission Reports',
      dateRange: 'Q4 2024',
      format: 'PDF',
      exportedAt: '2025-01-20 09:15:00',
      fileSize: '1.8 MB',
      status: 'completed'
    },
    {
      id: 3,
      type: 'Performance Data',
      dateRange: 'Year to Date',
      format: 'CSV',
      exportedAt: '2025-01-15 16:45:00',
      fileSize: '3.1 MB',
      status: 'completed'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const exportData = {
        type: exportType,
        dateRange,
        format,
        options: {
          includeCommissions,
          includeCustomerData,
          includeVehicleDetails
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('Exporting data:', exportData);
      alert(`Export completed! Your ${format.toUpperCase()} file has been downloaded.`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPrevious = (exportId) => {
    console.log('Downloading previous export:', exportId);
    alert('Download started!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Icon name="CheckCircle" size={16} className="text-success" />;
      case 'processing':
        return <Icon name="Clock" size={16} className="text-warning" />;
      case 'failed':
        return <Icon name="XCircle" size={16} className="text-destructive" />;
      default:
        return <Icon name="FileText" size={16} className="text-muted-foreground" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Export Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Export Your Data</h3>
        <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Data Type"
                options={exportTypeOptions}
                value={exportType}
                onChange={setExportType}
              />

              <Select
                label="Date Range"
                options={dateRangeOptions}
                value={dateRange}
                onChange={setDateRange}
              />

              <Select
                label="Format"
                options={formatOptions}
                value={format}
                onChange={setFormat}
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Include Additional Data</h4>
              <div className="space-y-3">
                <Checkbox
                  label="Commission Details"
                  description="Include commission calculations and breakdowns"
                  checked={includeCommissions}
                  onChange={(e) => setIncludeCommissions(e.target.checked)}
                />

                <Checkbox
                  label="Customer Information"
                  description="Include customer names and contact details (if permitted)"
                  checked={includeCustomerData}
                  onChange={(e) => setIncludeCustomerData(e.target.checked)}
                />

                <Checkbox
                  label="Vehicle Details"
                  description="Include make, model, year, and VIN information"
                  checked={includeVehicleDetails}
                  onChange={(e) => setIncludeVehicleDetails(e.target.checked)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                onClick={handleExport}
                loading={isExporting}
                iconName="Download"
                iconPosition="left"
              >
                {isExporting ? 'Preparing Export...' : 'Export Data'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Export History */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Export History</h3>
        <div className="bg-card border border-border rounded-lg shadow-soft">
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <Icon name="History" size={20} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Recent Exports</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {exportHistory.map((export_item) => (
              <div key={export_item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(export_item.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-foreground">
                          {export_item.type}
                        </p>
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                          {export_item.format}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {export_item.dateRange} • {export_item.fileSize}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Exported on {formatDate(export_item.exportedAt)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPrevious(export_item.id)}
                    iconName="Download"
                    iconPosition="left"
                  >
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {exportHistory.length === 0 && (
            <div className="p-8 text-center">
              <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No export history available</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Privacy Notice */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={20} className="text-primary mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Data Privacy Notice</h4>
            <p className="text-xs text-muted-foreground">
              Exported data contains sensitive information. Please handle according to company data privacy policies. 
              Customer information is only included when you have appropriate permissions. All exports are logged for security purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportData;