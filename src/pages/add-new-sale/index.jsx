import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import { useAuth } from '../../contexts/AuthContext';
import salesService from '../../utils/salesService';
import commissionCalculator from '../../utils/commissionCalculator';

import SaleInformationSection from './components/SaleInformationSection';
import AccessoriesSection from './components/AccessoriesSection';
import WarrantySection from './components/WarrantySection';
import MaintenanceSection from './components/MaintenanceSection';
import SpiffBonusSection from './components/SpiffBonusSection';
import SharedSaleSection from './components/SharedSaleSection';
import CommissionPreview from './components/CommissionPreview';
import ScreenshotUpload from './components/ScreenshotUpload';

const AddNewSale = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [stockValidationPassed, setStockValidationPassed] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    stockNumber: '',
    customerName: '',
    vehicleType: '',
    salePrice: '',
    accessoriesValue: '',
    warrantySellingPrice: '',
    warrantyCost: '',
    servicePrice: '',
    serviceCost: '',
    hasSpiffBonus: false,
    spiffAmount: '',
    spiffComments: '',
    isSharedSale: false,
    salesPartner: '',
    commissionSplit: ''
  });

  const [accessories, setAccessories] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [spiffs, setSpiffs] = useState([]);
  const [sharedSale, setSharedSale] = useState({
    isShared: false,
    partnerId: null,
    splitPercentage: 50
  });
  const [screenshots, setScreenshots] = useState({
    warranty: null,
    service: null,
    spiff: null
  });

  const [commissions, setCommissions] = useState({
    sale: 0,
    accessories: 0,
    warranty: 0,
    service: 0,
    spiff: 0,
    total: 0
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Calculate commissions when form data changes
  useEffect(() => {
    calculateCommissions();
  }, [formData, accessories, warranties, maintenanceItems, spiffs]);

  const calculateCommissions = () => {
    const salePrice = parseFloat(formData.salePrice) || 0;
    const accessoriesValue = accessories.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const warrantyProfit = warranties.reduce((sum, item) => sum + ((parseFloat(item.sellingPrice) || 0) - (parseFloat(item.cost) || 0)), 0);
    const serviceProfit = maintenanceItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) - (parseFloat(item.cost) || 0)), 0);
    const spiffTotal = spiffs.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // Calculate sale commission based on tiers
    let saleCommission = 0;
    if (salePrice >= 30000) saleCommission = 500;
    else if (salePrice >= 20000) saleCommission = 400;
    else if (salePrice >= 10000) saleCommission = 300;
    else if (salePrice > 0) saleCommission = 200;

    // Calculate accessories commission
    let accessoriesCommission = 0;
    if (formData.vehicleType === 'new') {
      accessoriesCommission = accessoriesValue > 998 ? Math.floor((accessoriesValue - 998) / 998) * 100 : 0;
    } else {
      accessoriesCommission = Math.floor(accessoriesValue / 850) * 100;
    }

    // Calculate warranty and service commissions (based on profit)
    const warrantyCommission = Math.max(0, Math.floor(warrantyProfit / 900) * 100);
    const serviceCommission = Math.max(0, Math.floor(serviceProfit / 900) * 100);

    const totalCommission = saleCommission + accessoriesCommission + warrantyCommission + serviceCommission + spiffTotal;

    setCommissions({
      sale: saleCommission,
      accessories: accessoriesCommission,
      warranty: warrantyCommission,
      service: serviceCommission,
      spiff: spiffTotal,
      total: totalCommission
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleAccessoriesChange = (newAccessories) => {
    setAccessories(newAccessories);
  };

  const handleWarrantiesChange = (newWarranties) => {
    setWarranties(newWarranties);  
  };

  const handleMaintenanceChange = (newMaintenance) => {
    setMaintenanceItems(newMaintenance);
  };

  const handleSpiffsChange = (newSpiffs) => {
    setSpiffs(newSpiffs);
  };

  const handleSharedSaleChange = (newSharedSale) => {
    setSharedSale(newSharedSale);
  };

  const handleScreenshotsChange = (newScreenshots) => {
    setScreenshots(newScreenshots);
  };

  const handleStockValidation = (isValid) => {
    setStockValidationPassed(isValid);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.stockNumber) newErrors.stockNumber = 'Stock number is required';
    if (!formData.customerName) newErrors.customerName = 'Customer name is required';
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    if (!formData.salePrice) newErrors.salePrice = 'Sale price is required';

    if (!stockValidationPassed) {
      newErrors.stockNumber = 'Please resolve stock number validation issues';
    }

    if (spiffs.length > 0 && spiffs.some(spiff => !spiff.amount)) {
      newErrors.spiff = 'SPIFF bonus amount is required when SPIFF is selected';
    }

    if (sharedSale.isShared && !sharedSale.partnerId) {
      newErrors.sharedSale = 'Please select sales partner for shared sales';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (saveAsDraft = false) => {
    if (!saveAsDraft && !validateForm()) {
      return;
    }

    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setIsDraft(saveAsDraft);

    try {
      // Compute totals using the same rules as calculator for consistency
      const salePrice = parseFloat(formData.salePrice) || 0;
      const accessoriesValue = accessories.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      const warrantySellingPrice = warranties.reduce((sum, item) => sum + (parseFloat(item.sellingPrice) || 0), 0);
      const warrantyCost = warranties.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
      const servicePrice = maintenanceItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      const serviceCost = maintenanceItems.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
      const spiffTotal = spiffs.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

      const totals = commissionCalculator.calculateTotalCommission(
        salePrice,
        accessoriesValue,
        formData.vehicleType,
        warrantySellingPrice,
        warrantyCost,
        servicePrice,
        serviceCost,
        spiffTotal
      );

      const saleData = {
        salesperson_id: user.id,
        stock_number: formData.stockNumber,
        customer_name: formData.customerName,
        vehicle_type: formData.vehicleType,
        sale_price: salePrice,
        sale_date: new Date()?.toISOString()?.split('T')?.[0],
        accessories_value: accessoriesValue,
        warranty_selling_price: warrantySellingPrice,
        warranty_cost: warrantyCost,
        service_price: servicePrice,
        service_cost: serviceCost,
        spiff_bonus: spiffTotal,
        spiff_comments: spiffs.map(spiff => spiff.comments).filter(Boolean).join('; '),
        is_shared_sale: sharedSale.isShared,
        sales_partner_id: sharedSale.isShared ? sharedSale.partnerId : null,
        status: saveAsDraft ? 'pending' : 'completed'
      };

      // Create the sale first
      const result = await salesService.createSale(saleData);

      if (!result.success) {
        alert(`Error saving sale: ${result.error}`);
        setIsSubmitting(false);
        setIsDraft(false);
        return;
      }

      const newSale = result.data;

      // Create commission records based on shared flag (50/50 split when shared)
      const commissionCreate = await salesService.createCommissionRecords(
        newSale?.id,
        user.id,
        sharedSale?.partnerId || null,
        totals?.total || 0,
        !!sharedSale?.isShared
      );

      if (!commissionCreate?.success) {
        console.error('Failed to create commission records:', commissionCreate?.error);
        // Continue but notify
        alert('Sale created, but failed to create commission records. You may need to re-save or contact admin.');
      }

      if (saveAsDraft) {
        alert('Sale saved as draft successfully!');
      } else {
        alert('Sale submitted successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      alert('Error saving sale. Please try again.');
      console.log('Submit error:', error);
    } finally {
      setIsSubmitting(false);
      setIsDraft(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/dashboard');
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Add New Sale</h1>
            <p className="text-muted-foreground">
              Record a new vehicle sale and calculate commission details
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SaleInformationSection
                formData={formData}
                onFormChange={handleChange}
                onStockValidation={handleStockValidation}
                errors={errors}
              />
              
              <AccessoriesSection
                accessories={accessories}
                onAccessoriesChange={handleAccessoriesChange}
              />
              
              <WarrantySection
                warranties={warranties}
                onWarrantiesChange={handleWarrantiesChange}
              />
              
              <MaintenanceSection
                maintenanceItems={maintenanceItems}
                onMaintenanceChange={handleMaintenanceChange}
              />
              
              <SpiffBonusSection
                spiffs={spiffs}
                onSpiffsChange={handleSpiffsChange}
              />
              
              <SharedSaleSection
                sharedSale={sharedSale}
                onSharedSaleChange={handleSharedSaleChange}
                error={errors.sharedSale}
              />
              
              <ScreenshotUpload
                screenshots={screenshots}
                onScreenshotsChange={handleScreenshotsChange}
              />

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-border rounded-md text-foreground hover:bg-muted transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="px-6 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors"
                  disabled={isSubmitting}
                >
                  {isDraft ? 'Saving Draft...' : 'Save as Draft'}
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting && !isDraft ? 'Submitting...' : 'Submit Sale'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <CommissionPreview
                formData={formData}
                accessories={accessories}
                warranties={warranties}
                maintenanceItems={maintenanceItems}
                spiffs={spiffs}
                sharedSale={sharedSale}
                commissions={commissions}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddNewSale;
