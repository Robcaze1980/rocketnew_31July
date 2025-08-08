import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ExportModal = ({ salesData, onClose }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeFilters, setIncludeFilters] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    
    try {
      if (exportFormat === 'csv') {
        exportToCSV();
      } else {
        exportToPDF();
      }
      
      // Simulate export delay
      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Customer Name',
      'Vehicle Details',
      'Stock Number',
      'Sale Price',
      'Commission Amount',
      'Status',
      'Salesperson'
    ];

    const csvContent = [
      headers.join(','),
      ...salesData.map(sale => [
        sale.date,
        `"${sale.customerName}"`,
        `"${sale.vehicleDetails}"`,
        sale.stockNumber,
        sale.salePrice,
        sale.commissionAmount,
        sale.status,
        `"${sale.salesperson}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    // This would typically use a PDF library like jsPDF
    console.log('PDF export not implemented in this demo');
    alert('PDF export functionality would be implemented here');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-elevated w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Export Sales Data</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconName="X"
          />
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <div className="flex items-center space-x-2">
                  <Icon name="FileText" size={16} />
                  <span className="text-sm text-foreground">CSV (Comma Separated Values)</span>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <div className="flex items-center space-x-2">
                  <Icon name="FileText" size={16} />
                  <span className="text-sm text-foreground">PDF (Portable Document Format)</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={includeFilters}
                onChange={(e) => setIncludeFilters(e.target.checked)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Include filter criteria in export</span>
            </label>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Info" size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">Export Summary</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {salesData.length} sales record{salesData.length > 1 ? 's' : ''} will be exported in {exportFormat.toUpperCase()} format.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            loading={exporting}
            iconName="Download"
            iconPosition="left"
          >
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;