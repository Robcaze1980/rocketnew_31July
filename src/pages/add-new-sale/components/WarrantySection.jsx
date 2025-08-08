import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import ScreenshotUpload from './ScreenshotUpload';
import Button from '../../../components/ui/Button';

const WarrantySection = ({ warranties, onWarrantiesChange }) => {
  const [aiExtractedData, setAiExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  const handleFileUpload = (file) => {
    if (file) {
      setIsProcessing(true);
    } else {
      setIsProcessing(false);
      setAiExtractedData(null);
      setManualOverride(false);
    }
  };

  const handleAIExtraction = (data) => {
    setIsProcessing(false);
    if (data) {
      const profit = data.sellingPrice - data.cost;
      const extractedData = { ...data, profit };
      setAiExtractedData(extractedData);
      
      // Auto-populate form fields if not manually overridden
      if (!manualOverride) {
        const newWarranties = [{
          id: 'warranty_main',
          description: 'Primary Service Contract',
          sellingPrice: extractedData.sellingPrice.toString(),
          cost: extractedData.cost.toString()
        }];
        onWarrantiesChange?.(newWarranties);
      }
    }
  };

  const handleManualChange = (field, value) => {
    setManualOverride(true);
    const currentWarranty = warranties?.[0] || { id: 'warranty_main', description: 'Primary Service Contract' };
    const updatedWarranty = {
      ...currentWarranty,
      [field]: value
    };
    onWarrantiesChange?.([updatedWarranty]);
  };

  const useAIData = () => {
    if (aiExtractedData) {
      const newWarranties = [{
        id: 'warranty_main',
        description: 'Primary Service Contract',
        sellingPrice: aiExtractedData.sellingPrice.toString(),
        cost: aiExtractedData.cost.toString()
      }];
      onWarrantiesChange?.(newWarranties);
      setManualOverride(false);
    }
  };

  const currentWarranty = warranties?.[0] || {};
  const sellingPrice = parseFloat(currentWarranty.sellingPrice) || 0;
  const cost = parseFloat(currentWarranty.cost) || 0;
  const profit = sellingPrice - cost;
  const commission = Math.max(0, Math.floor(profit / 900) * 100);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="Shield" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Warranty</h3>
      </div>

      <div className="space-y-6">
        <ScreenshotUpload
          title="Primary Service Contract Pricing Screenshot"
          description="Upload a screenshot of the warranty pricing document. AI will extract selling price and cost automatically."
          onFileUpload={handleFileUpload}
          onAIExtraction={handleAIExtraction}
          extractedData={aiExtractedData}
          isProcessing={isProcessing}
        />

        {aiExtractedData && manualOverride && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon name="Lightbulb" size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  AI extracted data is available
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={useAIData}
                iconName="Download"
                iconPosition="left"
              >
                Use AI Data
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Warranty Selling Price"
              type="text"
              placeholder="0.00"
              value={currentWarranty.sellingPrice || ''}
              onChange={(e) => handleManualChange('sellingPrice', e.target.value.replace(/[^\d.]/g, ''))}
            />
            {currentWarranty.sellingPrice && (
              <p className="text-sm text-muted-foreground mt-1">
                ${parseFloat(currentWarranty.sellingPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Warranty Cost"
              type="text"
              placeholder="0.00"
              value={currentWarranty.cost || ''}
              onChange={(e) => handleManualChange('cost', e.target.value.replace(/[^\d.]/g, ''))}
            />
            {currentWarranty.cost && (
              <p className="text-sm text-muted-foreground mt-1">
                ${parseFloat(currentWarranty.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>

        {(currentWarranty.sellingPrice || currentWarranty.cost) && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Commission Calculation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selling Price:</span>
                <span className="font-medium">${sellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-medium">${cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Profit:</span>
                <span className="font-medium">${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commission ($100 per $900 profit):</span>
                <span className="text-lg font-semibold text-success">
                  ${commission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantySection;