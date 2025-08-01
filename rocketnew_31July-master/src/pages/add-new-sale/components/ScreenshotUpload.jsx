import React, { useState, useRef } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import openaiService from '../../../utils/openaiService';

const ScreenshotUpload = ({ 
  title, 
  description, 
  onFileUpload, 
  onAIExtraction, 
  extractedData, 
  isProcessing, 
  acceptedTypes = "image/*" 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingState, setProcessingState] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);
      setExtractionError(null);
      onFileUpload(file);
      
      // Start AI processing
      setProcessingState(true);
      
      try {
        let result;
        
        // Use real AI extraction for all screenshot types
        if (title.toLowerCase().includes('warranty') || title.toLowerCase().includes('service contract')) {
          result = await openaiService.analyzeWarrantyScreenshot(file);
          
          if (result.success) {
            const extractedData = {
              sellingPrice: result.data.selling_price,
              cost: result.data.cost,
              profit: result.data.profit,
              extractionSource: result.data.extraction_source
            };
            onAIExtraction(extractedData);
          } else {
            setExtractionError(result.error);
            onAIExtraction(null);
          }
        } else if (title.toLowerCase().includes('maintenance')) {
          // Use new maintenance analysis
          result = await openaiService.analyzeMaintenanceScreenshot(file);
          
          if (result.success) {
            const extractedData = {
              sellingPrice: result.data.price,
              cost: result.data.cost,
              profit: result.data.profit,
              confidence: result.data.confidence
            };
            onAIExtraction(extractedData);
          } else {
            setExtractionError(result.error);
            onAIExtraction(null);
          }
        } else {
          // Use service screenshot analysis for other types
          result = await openaiService.analyzeServiceScreenshot(file);
          
          if (result.success) {
            const extractedData = {
              sellingPrice: result.data.price,
              cost: result.data.cost,
              profit: result.data.profit
            };
            onAIExtraction(extractedData);
          } else {
            setExtractionError(result.error);
            onAIExtraction(null);
          }
        }
      } catch (error) {
        setExtractionError(error.message);
        onAIExtraction(null);
      } finally {
        setProcessingState(false);
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file);
          }
          break;
        }
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setExtractionError(null);
    setProcessingState(false);
    onFileUpload(null);
    onAIExtraction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Icon name="Upload" size={18} className="text-primary" />
        <h4 className="font-medium text-foreground">{title}</h4>
      </div>
      
      <p className="text-sm text-muted-foreground">{description}</p>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {!uploadedFile ? (
          <div className="text-center">
            <Icon name="ImagePlus" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground mb-2">
              Drop screenshot here, paste from clipboard, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supports PNG, JPG, JPEG files up to 10MB
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              iconName="Upload"
              iconPosition="left"
            >
              Choose File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name="Image" size={20} className="text-success" />
                <div>
                  <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                iconName="X"
              >
                Remove
              </Button>
            </div>

            {(isProcessing || processingState) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Icon name="Loader2" size={16} className="text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-800">
                    AI is analyzing the screenshot for File ID, Selling Price, and other warranty fields...
                  </span>
                </div>
              </div>
            )}

            {extractionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Icon name="AlertCircle" size={16} className="text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Extraction failed: {extractionError}
                  </span>
                </div>
              </div>
            )}

            {extractedData && !isProcessing && !processingState && !extractionError && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon name="CheckCircle" size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Data extracted successfully
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Selling Price:</span>
                    <span className="ml-2 font-medium text-foreground">
                      ${extractedData.sellingPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="ml-2 font-medium text-foreground">
                      ${extractedData.cost?.toLocaleString()}
                    </span>
                  </div>
                </div>
                {extractedData.extractionSource && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Extracted from: {extractedData.extractionSource.cost_field} (cost), {extractedData.extractionSource.selling_price_field} (price)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ScreenshotUpload;