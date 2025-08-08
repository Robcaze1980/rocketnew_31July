import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const SaleInformationSection = ({ formData, onFormChange, onStockValidation, errors = {} }) => {
  const [stockValidation, setStockValidation] = useState({ isValid: null, message: '', isChecking: false });
  const [debounceTimer, setDebounceTimer] = useState(null);

  const vehicleTypeOptions = [
    { value: 'new', label: 'New Vehicle' },
    { value: 'used', label: 'Used Vehicle' }
  ];

  // Mock stock numbers for validation
  const existingStockNumbers = ['ST001', 'ST002', 'ST003', 'VH123', 'VH456'];

  const validateStockNumber = (stockNumber) => {
    if (!stockNumber || stockNumber.length < 3) {
      setStockValidation({ isValid: null, message: '', isChecking: false });
      onStockValidation?.(false);
      return;
    }

    setStockValidation({ isValid: null, message: '', isChecking: true });

    // Simulate API call delay
    setTimeout(() => {
      const isDuplicate = existingStockNumbers.includes(stockNumber.toUpperCase());
      
      if (isDuplicate) {
        setStockValidation({
          isValid: false,
          message: 'This stock number is already claimed by another sale. Please verify.',
          isChecking: false
        });
        onStockValidation?.(false);
      } else {
        setStockValidation({
          isValid: true,
          message: 'Stock number is available',
          isChecking: false
        });
        onStockValidation?.(true);
      }
    }, 1000);
  };

  const handleStockNumberChange = (e) => {
    const value = e.target.value.toUpperCase();
    onFormChange?.('stockNumber', value);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced validation
    const newTimer = setTimeout(() => {
      validateStockNumber(value);
    }, 500);
    
    setDebounceTimer(newTimer);
  };

  const handleSalePriceChange = (e) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    onFormChange?.('salePrice', value);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="FileText" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Sale Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <Input
            label="Stock Number"
            type="text"
            placeholder="Enter stock number"
            value={formData?.stockNumber || ''}
            onChange={handleStockNumberChange}
            required
            className="uppercase"
            error={errors?.stockNumber}
          />
          
          {stockValidation.isChecking && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon name="Loader2" size={14} className="animate-spin" />
              <span>Validating stock number...</span>
            </div>
          )}
          
          {stockValidation.isValid === true && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <Icon name="CheckCircle" size={14} />
              <span>{stockValidation.message}</span>
            </div>
          )}
          
          {stockValidation.isValid === false && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
              <div className="flex items-start space-x-2">
                <Icon name="AlertTriangle" size={16} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-600">Duplicate Stock Number</p>
                  <p className="text-sm text-red-500">{stockValidation.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Customer Name"
          type="text"
          placeholder="Enter customer full name"
          value={formData?.customerName || ''}
          onChange={(e) => onFormChange?.('customerName', e.target.value)}
          required
          error={errors?.customerName}
        />

        <Select
          label="Vehicle Type"
          placeholder="Select vehicle type"
          options={vehicleTypeOptions}
          value={formData?.vehicleType || ''}
          onChange={(value) => onFormChange?.('vehicleType', value)}
          required
          error={errors?.vehicleType}
        />

        <div>
          <Input
            label="Sale Price"
            type="text"
            placeholder="0.00"
            value={formData?.salePrice || ''}
            onChange={handleSalePriceChange}
            required
            error={errors?.salePrice}
          />
          {formData?.salePrice && (
            <p className="text-sm text-muted-foreground mt-1">
              ${parseFloat(formData.salePrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaleInformationSection;