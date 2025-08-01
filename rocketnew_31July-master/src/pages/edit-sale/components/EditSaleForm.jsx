import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import ScreenshotUpload from './ScreenshotUpload';
import salesService from '../../../utils/salesService';

const EditSaleForm = ({ saleData = {}, onFormChange, modifiedFields = [] }) => {
  const [formData, setFormData] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    saleInfo: true,
    accessories: true,
    warranty: true,
    maintenance: true,
    spiff: true,
    sharedSale: true
  });
  const [spiffPartnerOptions, setSpiffPartnerOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const isInitialized = useRef(false);
  const onFormChangeRef = useRef(onFormChange);
  const previousFormDataRef = useRef(null);

  // Fetch salespeople for spiff partner options
  useEffect(() => {
    const fetchSalespeople = async () => {
      try {
        setLoading(true);
        const result = await salesService?.getSalespeople();
        if (result?.success) {
          const partners = result?.data?.map(user => ({
            value: user?.id, // Use UUID as value
            label: user?.full_name
          }));
          setSpiffPartnerOptions(partners);
        } else {
          console.error('Failed to fetch salespeople:', result?.error);
        }
      } catch (error) {
        console.error('Error fetching salespeople:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalespeople();
  }, []);

  // Initialize form data when saleData changes with safe defaults - CRITICAL FIX
  useEffect(() => {
    if (saleData && Object.keys(saleData)?.length > 0) {
      // Ensure all fields have safe defaults
      const safeFormData = {
        stockNumber: saleData?.stockNumber || '',
        customerName: saleData?.customerName || '',
        vehicleType: saleData?.vehicleType || 'new',
        salePrice: saleData?.salePrice || 0,
        accessoriesValue: saleData?.accessoriesValue || 0,
        warrantySellingPrice: saleData?.warrantySellingPrice || 0,
        warrantyCost: saleData?.warrantyCost || 0,
        warrantyScreenshot: saleData?.warrantyScreenshot || null,
        maintenancePrice: saleData?.maintenancePrice || 0,
        maintenanceCost: saleData?.maintenanceCost || 0,
        maintenanceScreenshot: saleData?.maintenanceScreenshot || null,
        hasSpiffBonus: saleData?.hasSpiffBonus || false,
        spiffAmount: saleData?.spiffAmount || 0,
        spiffComments: saleData?.spiffComments || '',
        spiffProof: saleData?.spiffProof || null,
        isSharedSale: saleData?.isSharedSale || false,
        sharedPartner: saleData?.sharedPartner || '',
        sharedPartnerId: saleData?.sharedPartnerId || null,
        commissionSplit: saleData?.commissionSplit || 50,
        status: saleData?.status || 'pending',
        createdAt: saleData?.createdAt || new Date()?.toISOString(),
        lastModified: saleData?.lastModified || new Date()?.toISOString(),
        totalCommission: saleData?.totalCommission || 0,
        salespersonName: saleData?.salespersonName || 'Unknown',
        ...saleData // Spread original data to preserve any additional fields
      };
      setFormData(safeFormData);
      isInitialized.current = true;
    }
  }, [saleData]);

  const vehicleTypeOptions = [
    { value: 'new', label: 'New Vehicle' },
    { value: 'used', label: 'Used Vehicle' }
  ];

  // Update the ref when onFormChange changes
  useEffect(() => {
    onFormChangeRef.current = onFormChange;
  }, [onFormChange]);

    // Notify parent of form changes with null checks - FIXED to prevent infinite loop
  useEffect(() => {
    // Only call onFormChange if formData has been initialized and is not the initial load
    if (formData && Object.keys(formData)?.length > 0 && onFormChangeRef?.current && isInitialized?.current) {
      // Check if formData has actually changed to prevent unnecessary calls
      const currentFormDataString = JSON.stringify(formData);
      const previousFormDataString = JSON.stringify(previousFormDataRef?.current);

      if (currentFormDataString !== previousFormDataString) {
        previousFormDataRef.current = formData;
        onFormChangeRef?.current(formData);
      }
    }
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev?.[section]
    }));
  };

  const isFieldModified = (fieldName) => {
    return modifiedFields?.includes(fieldName) || false;
  };

  const getFieldClassName = (fieldName) => {
    return isFieldModified(fieldName) ? 'ring-2 ring-warning/50 bg-warning/5' : '';
  };

  const SectionHeader = ({ title, icon, section, isExpanded, onToggle }) => (
    <button
      onClick={() => onToggle(section)}
      className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-smooth"
    >
      <div className="flex items-center gap-3">
        <Icon name={icon} size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={20} className="text-muted-foreground" />
    </button>
  );

  // Early return with better null checking - CRITICAL FIX
  if (!saleData || Object.keys(saleData)?.length === 0 || !formData || Object.keys(formData)?.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sale Information */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <SectionHeader
          title="Sale Information"
          icon="FileText"
          section="saleInfo"
          isExpanded={expandedSections?.saleInfo || false}
          onToggle={toggleSection}
        />
        {expandedSections?.saleInfo && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Stock Number"
                type="text"
                value={formData?.stockNumber || ''}
                onChange={(e) => handleInputChange('stockNumber', e?.target?.value)}
                className={getFieldClassName('stockNumber')}
                required
              />
              <Input
                label="Customer Name"
                type="text"
                value={formData?.customerName || ''}
                onChange={(e) => handleInputChange('customerName', e?.target?.value)}
                className={getFieldClassName('customerName')}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Vehicle Type"
                options={vehicleTypeOptions}
                value={formData?.vehicleType || 'new'}
                onChange={(value) => handleInputChange('vehicleType', value)}
                className={getFieldClassName('vehicleType')}
                required
              />
              <Input
                label="Sale Price"
                type="number"
                value={formData?.salePrice || 0}
                onChange={(e) => handleInputChange('salePrice', parseFloat(e?.target?.value) || 0)}
                className={getFieldClassName('salePrice')}
                required
              />
            </div>
          </div>
        )}
      </div>
      {/* Accessories */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <SectionHeader
          title="Accessories"
          icon="Wrench"
          section="accessories"
          isExpanded={expandedSections?.accessories || false}
          onToggle={toggleSection}
        />
        {expandedSections?.accessories && (
          <div className="p-6">
            <Input
              label="Accessories Value"
              type="number"
              value={formData?.accessoriesValue || 0}
              onChange={(e) => handleInputChange('accessoriesValue', parseFloat(e?.target?.value) || 0)}
              className={getFieldClassName('accessoriesValue')}
              description="Commission calculated automatically based on vehicle type"
            />
          </div>
        )}
      </div>
      {/* Warranty */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <SectionHeader
          title="Warranty"
          icon="Shield"
          section="warranty"
          isExpanded={expandedSections?.warranty || false}
          onToggle={toggleSection}
        />
        {expandedSections?.warranty && (
          <div className="p-6 space-y-4">
            <ScreenshotUpload
              label="Warranty Screenshot"
              type="warranty"
              existingImage={formData?.warrantyScreenshot}
              onUpload={(imageData) => handleInputChange('warrantyScreenshot', imageData)}
              onExtractedData={(data) => {
                if (data?.sellingPrice) {
                  handleInputChange('warrantySellingPrice', data?.sellingPrice);
                }
                if (data?.cost) {
                  handleInputChange('warrantyCost', data?.cost);
                }
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Warranty Selling Price"
                type="number"
                value={formData?.warrantySellingPrice || 0}
                onChange={(e) => handleInputChange('warrantySellingPrice', parseFloat(e?.target?.value) || 0)}
                className={getFieldClassName('warrantySellingPrice')}
              />
              <Input
                label="Warranty Cost"
                type="number"
                value={formData?.warrantyCost || 0}
                onChange={(e) => handleInputChange('warrantyCost', parseFloat(e?.target?.value) || 0)}
                className={getFieldClassName('warrantyCost')}
              />
            </div>
          </div>
        )}
      </div>
      {/* Maintenance */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <SectionHeader
          title="Maintenance"
          icon="Settings"
          section="maintenance"
          isExpanded={expandedSections?.maintenance || false}
          onToggle={toggleSection}
        />
        {expandedSections?.maintenance && (
          <div className="p-6 space-y-4">
            <ScreenshotUpload
              label="Maintenance Screenshot"
              type="maintenance"
              existingImage={formData?.maintenanceScreenshot}
              onUpload={(imageData) => handleInputChange('maintenanceScreenshot', imageData)}
              onExtractedData={(data) => {
                if (data?.price) {
                  handleInputChange('maintenancePrice', data?.price);
                }
                if (data?.cost) {
                  handleInputChange('maintenanceCost', data?.cost);
                }
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Maintenance Price"
                type="number"
                value={formData?.maintenancePrice || 0}
                onChange={(e) => handleInputChange('maintenancePrice', parseFloat(e?.target?.value) || 0)}
                className={getFieldClassName('maintenancePrice')}
              />
              <Input
                label="Maintenance Cost"
                type="number"
                value={formData?.maintenanceCost || 0}
                onChange={(e) => handleInputChange('maintenanceCost', parseFloat(e?.target?.value) || 0)}
                className={getFieldClassName('maintenanceCost')}
              />
            </div>
          </div>
        )}
      </div>
      {/* SPIFF Bonus */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <SectionHeader
          title="SPIFF Bonus"
          icon="Award"
          section="spiff"
          isExpanded={expandedSections?.spiff || false}
          onToggle={toggleSection}
        />
        {expandedSections?.spiff && (
          <div className="p-6 space-y-4">
            <Checkbox
              label="SPIFF Bonus Applicable"
              checked={formData?.hasSpiffBonus || false}
              onChange={(e) => handleInputChange('hasSpiffBonus', e?.target?.checked)}
            />
            {formData?.hasSpiffBonus && (
              <>
                <Input
                  label="SPIFF Amount"
                  type="number"
                  value={formData?.spiffAmount || 0}
                  onChange={(e) => handleInputChange('spiffAmount', parseFloat(e?.target?.value) || 0)}
                  className={getFieldClassName('spiffAmount')}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Comments</label>
                  <textarea
                    value={formData?.spiffComments || ''}
                    onChange={(e) => handleInputChange('spiffComments', e?.target?.value)}
                    className={`w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${getFieldClassName('spiffComments')}`}
                    rows={3}
                    placeholder="Add comments about the SPIFF bonus..."
                  />
                </div>
                <ScreenshotUpload
                  label="SPIFF Proof Document"
                  type="spiff"
                  existingImage={formData?.spiffProof}
                  onUpload={(imageData) => handleInputChange('spiffProof', imageData)}
                />
              </>
            )}
          </div>
        )}
      </div>
      {/* Shared Sale */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <SectionHeader
          title="Shared Sale"
          icon="Users"
          section="sharedSale"
          isExpanded={expandedSections?.sharedSale || false}
          onToggle={toggleSection}
        />
        {expandedSections?.sharedSale && (
          <div className="p-6 space-y-4">
            <Checkbox
              label="Shared Sale"
              checked={formData?.isSharedSale || false}
              onChange={(e) => handleInputChange('isSharedSale', e?.target?.checked)}
            />
            {formData?.isSharedSale && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Partner"
                  options={spiffPartnerOptions}
                  value={formData?.sharedPartner || ''}
                  onChange={(value) => handleInputChange('sharedPartner', value)}
                  className={getFieldClassName('sharedPartner')}
                />
                <Input
                  label="Commission Split (%)"
                  type="number"
                  value={formData?.commissionSplit || 50}
                  onChange={(e) => handleInputChange('commissionSplit', parseFloat(e?.target?.value) || 50)}
                  className={getFieldClassName('commissionSplit')}
                  min="1"
                  max="99"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditSaleForm;
