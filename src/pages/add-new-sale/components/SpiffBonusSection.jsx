import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SpiffBonusSection = ({ spiffs, onSpiffsChange }) => {
  const [proofFile, setProofFile] = useState(null);

  const currentSpiff = spiffs?.[0] || {};

  const handleSpiffToggle = (checked) => {
    if (checked) {
      const newSpiffs = [{
        id: 'spiff_main',
        description: 'SPIFF Bonus',
        amount: '',
        comments: ''
      }];
      onSpiffsChange?.(newSpiffs);
    } else {
      onSpiffsChange?.([]);
      setProofFile(null);
    }
  };

  const handleSpiffChange = (field, value) => {
    const updatedSpiff = {
      ...currentSpiff,
      id: currentSpiff.id || 'spiff_main',
      description: currentSpiff.description || 'SPIFF Bonus',
      [field]: value
    };
    onSpiffsChange?.([updatedSpiff]);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    handleSpiffChange('amount', value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
    }
  };

  const removeProofFile = () => {
    setProofFile(null);
    const fileInput = document.getElementById('spiff-proof-upload');
    if (fileInput) fileInput.value = '';
  };

  const hasSpiffBonus = spiffs?.length > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="Award" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">SPIFF Bonus</h3>
      </div>

      <div className="space-y-6">
        <Checkbox
          label="This sale qualifies for SPIFF bonus"
          description="Check if this sale meets SPIFF bonus criteria"
          checked={hasSpiffBonus}
          onChange={(e) => handleSpiffToggle(e.target.checked)}
        />

        {hasSpiffBonus && (
          <div className="space-y-6 pl-6 border-l-2 border-primary/20">
            <div>
              <Input
                label="SPIFF Bonus Amount"
                type="text"
                placeholder="0.00"
                value={currentSpiff.amount || ''}
                onChange={handleAmountChange}
                required
              />
              {currentSpiff.amount && (
                <p className="text-sm text-muted-foreground mt-1">
                  ${parseFloat(currentSpiff.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Comments/Justification
              </label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                rows={4}
                placeholder="Explain why this sale qualifies for SPIFF bonus..."
                value={currentSpiff.comments || ''}
                onChange={(e) => handleSpiffChange('comments', e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Icon name="Paperclip" size={18} className="text-primary" />
                <h4 className="font-medium text-foreground">Proof Documentation</h4>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Upload documentation that supports the SPIFF bonus claim (emails, approvals, etc.)
              </p>

              {!proofFile ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Icon name="Upload" size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-2">
                    Upload proof documentation
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('spiff-proof-upload')?.click()}
                    iconName="Upload"
                    iconPosition="left"
                  >
                    Choose File
                  </Button>
                  <input
                    id="spiff-proof-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon name="FileText" size={20} className="text-success" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{proofFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeProofFile}
                      iconName="X"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {currentSpiff.amount && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="Award" size={16} className="text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">SPIFF Bonus Summary</span>
                </div>
                <div className="text-sm text-amber-700">
                  <p>Bonus Amount: <span className="font-semibold">${parseFloat(currentSpiff.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                  <p className="text-xs mt-1">This amount will be added to your total commission</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpiffBonusSection;