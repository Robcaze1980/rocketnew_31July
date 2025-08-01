import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import ScreenshotUpload from './ScreenshotUpload';
import Button from '../../../components/ui/Button';

const MaintenanceSection = ({ maintenanceItems, onMaintenanceChange }) => {
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
        const newMaintenanceItems = [{
          id: 'maintenance_main',
          description: 'Service Package',
          price: extractedData.sellingPrice.toString(),
          cost: extractedData.cost.toString()
        }];
        onMaintenanceChange?.(newMaintenanceItems);
      }
    }
  };

  const handleManualChange = (field, value) => {
    setManualOverride(true);
    const currentItem = maintenanceItems?.[0] || { id: 'maintenance_main', description: 'Service Package' };
    const updatedItem = {
      ...currentItem,
      [field]: value
    };
    onMaintenanceChange?.([updatedItem]);
  };

  const useAIData = () => {
    if (aiExtractedData) {
      const newMaintenanceItems = [{
        id: 'maintenance_main',
        description: 'Service Package',
        price: aiExtractedData.sellingPrice.toString(),
        cost: aiExtractedData.cost.toString()
      }];
      onMaintenanceChange?.(newMaintenanceItems);
      setManualOverride(false);
    }
  };

  const currentItem = maintenanceItems?.[0] || {};
  const price = parseFloat(currentItem.price) || 0;
  const cost = parseFloat(currentItem.cost) || 0;
  const profit = price - cost;
  const commission = Math.max(0, Math.floor(profit / 900) * 100);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="Wrench" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Maintenance & Service</h3>
      </div>

      <div className="space-y-6">
        <ScreenshotUpload
          title="Service Pricing Screenshot"
          description="Upload a screenshot of the maintenance/service pricing document. AI will extract price and cost from Price|Cost rows."
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
              label="Service Price"
              type="text"
              placeholder="0.00"
              value={currentItem.price || ''}
              onChange={(e) => handleManualChange('price', e.target.value.replace(/[^\d.]/g, ''))}
            />
            {currentItem.price && (
              <p className="text-sm text-muted-foreground mt-1">
                ${parseFloat(currentItem.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Service Cost"
              type="text"
              placeholder="0.00"
              value={currentItem.cost || ''}
              onChange={(e) => handleManualChange('cost', e.target.value.replace(/[^\d.]/g, ''))}
            />
            {currentItem.cost && (
              <p className="text-sm text-muted-foreground mt-1">
                ${parseFloat(currentItem.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>

        {(currentItem.price || currentItem.cost) && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Commission Calculation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Price:</span>
                <span className="font-medium">${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Cost:</span>
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

export default MaintenanceSection;