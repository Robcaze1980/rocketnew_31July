import React, { useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const AccessoriesSection = ({ accessories, onAccessoriesChange }) => {
  const calculateAccessoriesCommission = (value, vehicleType) => {
    const accessoriesValue = parseFloat(value) || 0;
    
    // Commission rules based on vehicle type
    let commission = 0;
    if (vehicleType === 'new') {
      commission = accessoriesValue > 998 ? Math.floor((accessoriesValue - 998) / 998) * 100 : 0;
    } else {
      commission = Math.floor(accessoriesValue / 850) * 100;
    }
    return commission;
  };

  const handleAccessoriesChange = (e) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    const newAccessories = [{
      id: 'accessories_total',
      description: 'Total Accessories Value',
      price: value
    }];
    onAccessoriesChange?.(newAccessories);
  };

  const accessoriesValue = accessories?.[0]?.price || '';
  const vehicleType = 'new'; // Default to new for commission calculation display
  const accessoriesCommission = calculateAccessoriesCommission(accessoriesValue, vehicleType);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="Package" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Accessories</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            label="Accessories Value"
            type="text"
            placeholder="0.00"
            value={accessoriesValue}
            onChange={handleAccessoriesChange}
            description="Enter the total value of accessories sold"
          />
          {accessoriesValue && (
            <p className="text-sm text-muted-foreground mt-1">
              ${parseFloat(accessoriesValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {accessoriesValue && parseFloat(accessoriesValue) > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Commission Calculation</span>
              <span className="text-sm text-muted-foreground">
                Commission Structure
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                ${parseFloat(accessoriesValue).toLocaleString('en-US', { minimumFractionDigits: 2 })} accessories value
              </span>
              <span className="text-lg font-semibold text-success">
                ${accessoriesCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Commission Rates</p>
              <ul className="space-y-1 text-blue-700">
                <li>• New Vehicles: $100 per $998 tier above $998</li>
                <li>• Used Vehicles: $100 per $850 tier</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessoriesSection;