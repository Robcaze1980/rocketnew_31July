import React from 'react';
import Icon from '../../../components/AppIcon';

const ChangeTracker = ({ modifiedFields = [], originalData = {}, currentData = {} }) => {
  // Enhanced null checks and early return - CRITICAL FIX
  if (!modifiedFields || !Array.isArray(modifiedFields) || modifiedFields.length === 0) {
    return null;
  }

  // Additional safety check for data objects
  if (!originalData || !currentData || 
      Object.keys(originalData).length === 0 || 
      Object.keys(currentData).length === 0) {
    return null;
  }

  const getFieldLabel = (fieldName) => {
    const labels = {
      stockNumber: 'Stock Number',
      customerName: 'Customer Name',
      vehicleType: 'Vehicle Type',
      salePrice: 'Sale Price',
      accessoriesValue: 'Accessories Value',
      warrantySellingPrice: 'Warranty Selling Price',
      warrantyCost: 'Warranty Cost',
      maintenancePrice: 'Maintenance Price',
      maintenanceCost: 'Maintenance Cost',
      spiffAmount: 'SPIFF Amount',
      spiffComments: 'SPIFF Comments',
      commissionSplit: 'Commission Split',
      hasSpiffBonus: 'SPIFF Bonus',
      isSharedSale: 'Shared Sale'
    };
    return labels[fieldName] || fieldName;
  };

  const formatValue = (value, fieldName) => {
    // Handle null/undefined values safely
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Handle numeric values for currency fields
    if (typeof value === 'number' && (fieldName.includes('Price') || fieldName.includes('Cost') || 
         fieldName.includes('Value') || fieldName.includes('Amount'))) {
      return `$${value.toLocaleString()}`;
    }
    
    // Handle commission split percentage
    if (fieldName === 'commissionSplit' && typeof value === 'number') {
      return `${value}%`;
    }
    
    // Handle string and other values
    return value?.toString() || 'N/A';
  };

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="AlertTriangle" size={16} className="text-warning" />
        <h4 className="text-sm font-medium text-warning">Unsaved Changes</h4>
      </div>
      <div className="space-y-2">
        {modifiedFields?.map((fieldName) => {
          // Additional safety check for each field
          if (!fieldName || 
              !originalData.hasOwnProperty(fieldName) || 
              !currentData.hasOwnProperty(fieldName)) {
            return null;
          }
          
          return (
            <div key={fieldName} className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">
                {getFieldLabel(fieldName)}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground line-through">
                  {formatValue(originalData[fieldName], fieldName)}
                </span>
                <Icon name="ArrowRight" size={12} className="text-muted-foreground" />
                <span className="text-warning font-medium">
                  {formatValue(currentData[fieldName], fieldName)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChangeTracker;