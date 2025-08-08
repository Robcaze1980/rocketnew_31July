import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import salesService from '../../utils/salesService';
import commissionCalculator from '../../utils/commissionCalculator';
import Sidebar from '../../components/ui/Sidebar';
import SaleHeader from './components/SaleHeader';
import EditSaleForm from './components/EditSaleForm';
import CommissionSidebar from './components/CommissionSidebar';
import ChangeTracker from './components/ChangeTracker';
import ScreenshotUpload from './components/ScreenshotUpload';
import ActionButtons from './components/ActionButtons';

const EditSale = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: saleId } = useParams();

  // State management
  const [originalSaleData, setOriginalSaleData] = useState(null);
  const [currentSaleData, setCurrentSaleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modifiedFields, setModifiedFields] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState({});
  const [screenshots, setScreenshots] = useState({
    warranty: null,
    service: null,
    spiff: null
  });

  // Load sale data from Supabase with improved error handling
  useEffect(() => {
    let isMounted = true;

    const loadSaleData = async () => {
      if (!saleId || !user?.id) {
        if (isMounted) {
          setError('Missing sale ID or user authentication');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await salesService.getSaleById(saleId);

        if (!isMounted) return;

        if (result?.success && result?.data) {
          const saleData = result.data;
          
          // Transform data with safe defaults and optional chaining
          const transformedData = {
            id: saleData?.id || '',
            stockNumber: saleData?.stock_number || '',
            customerName: saleData?.customer_name || '',
            vehicleType: saleData?.vehicle_type || 'new',
            salePrice: parseFloat(saleData?.sale_price) || 0,
            accessoriesValue: parseFloat(saleData?.accessories_value) || 0,
            warrantySellingPrice: parseFloat(saleData?.warranty_selling_price) || 0,
            warrantyCost: parseFloat(saleData?.warranty_cost) || 0,
            warrantyScreenshot: saleData?.warranty_screenshot_url || null,
            maintenancePrice: parseFloat(saleData?.service_price) || 0,
            maintenanceCost: parseFloat(saleData?.service_cost) || 0,
            maintenanceScreenshot: saleData?.service_screenshot_url || null,
            hasSpiffBonus: parseFloat(saleData?.spiff_bonus || 0) > 0,
            spiffAmount: parseFloat(saleData?.spiff_bonus) || 0,
            spiffComments: saleData?.spiff_comments || '',
            spiffProof: saleData?.spiff_proof_url || null,
            isSharedSale: saleData?.is_shared_sale || false,
            sharedPartner: saleData?.sales_partner?.full_name || '',
            sharedPartnerId: saleData?.sales_partner_id || null,
            commissionSplit: 50, // Default split
            status: saleData?.status || 'pending',
            createdAt: saleData?.created_at || new Date().toISOString(),
            lastModified: saleData?.updated_at || new Date().toISOString(),
            totalCommission: parseFloat(saleData?.commission_total) || 0,
            salespersonName: saleData?.salesperson?.full_name || 'Unknown'
          };

          setOriginalSaleData(transformedData);
          setCurrentSaleData(transformedData);
          
          // Initialize screenshots safely
          setScreenshots({
            warranty: transformedData?.warrantyScreenshot || null,
            service: transformedData?.maintenanceScreenshot || null,
            spiff: transformedData?.spiffProof || null
          });
        } else {
          setError(result?.error || 'Sale not found or access denied');
        }
      } catch (error) {
        if (isMounted) {
          if (error?.message?.includes('Failed to fetch') || 
              error?.message?.includes('NetworkError')) {
            setError('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
          } else {
            setError('Failed to load sale data. Please try again.');
          }
          console.log('Error loading sale:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSaleData();

    return () => {
      isMounted = false;
    };
  }, [saleId, user?.id]);

  // Calculate commission based on form data with safe defaults
  const calculateCommission = useCallback((data) => {
    if (!data) return { total: 0, breakdown: [] };

    let baseCommission = 0;
    const salePrice = parseFloat(data?.salePrice) || 0;
    
    // Base commission based on sale price
    if (salePrice >= 30000) baseCommission = 500;
    else if (salePrice >= 20000) baseCommission = 400;
    else if (salePrice >= 10000) baseCommission = 300;
    else baseCommission = 200;

    // Accessories commission (different rates for new vs used)
    const accessoriesRate = data?.vehicleType === 'new' ? 0.15 : 0.12;
    const accessoriesValue = parseFloat(data?.accessoriesValue) || 0;
    const accessoriesCommission = accessoriesValue * accessoriesRate;

    // Warranty commission (profit margin)
    const warrantySellingPrice = parseFloat(data?.warrantySellingPrice) || 0;
    const warrantyCost = parseFloat(data?.warrantyCost) || 0;
    const warrantyProfit = warrantySellingPrice - warrantyCost;
    const warrantyCommission = warrantyProfit * 0.3;

    // Maintenance commission (profit margin)
    const maintenancePrice = parseFloat(data?.maintenancePrice) || 0;
    const maintenanceCost = parseFloat(data?.maintenanceCost) || 0;
    const maintenanceProfit = maintenancePrice - maintenanceCost;
    const maintenanceCommission = maintenanceProfit * 0.25;

    // SPIFF bonus
    const spiffBonus = data?.hasSpiffBonus ? (parseFloat(data?.spiffAmount) || 0) : 0;

    const totalCommission = baseCommission + accessoriesCommission + warrantyCommission + maintenanceCommission + spiffBonus;

    // Apply shared sale split
    const commissionSplit = parseFloat(data?.commissionSplit) || 50;
    const finalCommission = data?.isSharedSale ? totalCommission * (commissionSplit / 100) : totalCommission;

    return {
      total: Math.round(finalCommission),
      breakdown: [
        { label: 'Base Commission', amount: baseCommission },
        { label: 'Accessories', amount: Math.round(accessoriesCommission) },
        { label: 'Warranty', amount: Math.round(warrantyCommission) },
        { label: 'Maintenance', amount: Math.round(maintenanceCommission) },
        { label: 'SPIFF Bonus', amount: spiffBonus }
      ]
    };
  }, []);

  const [commissionData, setCommissionData] = useState(() => ({
    total: 0,
    breakdown: []
  }));

  // Track field changes with safe comparison
  useEffect(() => {
    if (!originalSaleData || !currentSaleData) return;

    const changesList = [];
    Object.keys(currentSaleData).forEach(key => {
      if (currentSaleData[key] !== originalSaleData[key]) {
        changesList.push(key);
      }
    });
    setModifiedFields(changesList);
  }, [currentSaleData, originalSaleData]);

  // Update commission when form data changes
  useEffect(() => {
    if (currentSaleData) {
      const newCommissionData = calculateCommission(currentSaleData);
      setCommissionData(newCommissionData);
    }
  }, [currentSaleData, calculateCommission]);

  const handleFormChange = useCallback((updatedFormData) => {
    if (updatedFormData) {
      setCurrentSaleData(updatedFormData);
    }
  }, []);

  const handleSave = async () => {
    if (!originalSaleData || !currentSaleData || !saleId) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Transform data back to database format with safe defaults
      const updateData = {
        stock_number: currentSaleData?.stockNumber || '',
        customer_name: currentSaleData?.customerName || '',
        vehicle_type: currentSaleData?.vehicleType || 'new',
        sale_price: parseFloat(currentSaleData?.salePrice) || 0,
        accessories_value: parseFloat(currentSaleData?.accessoriesValue) || 0,
        warranty_selling_price: parseFloat(currentSaleData?.warrantySellingPrice) || 0,
        warranty_cost: parseFloat(currentSaleData?.warrantyCost) || 0,
        service_price: parseFloat(currentSaleData?.maintenancePrice) || 0,
        service_cost: parseFloat(currentSaleData?.maintenanceCost) || 0,
        spiff_bonus: currentSaleData?.hasSpiffBonus ? (parseFloat(currentSaleData?.spiffAmount) || 0) : 0,
        spiff_comments: currentSaleData?.spiffComments || '',
        is_shared_sale: currentSaleData?.isSharedSale || false,
        sales_partner_id: currentSaleData?.isSharedSale ? currentSaleData?.sharedPartnerId : null,
        warranty_screenshot_url: screenshots?.warranty || null,
        service_screenshot_url: screenshots?.service || null,
        spiff_proof_url: screenshots?.spiff || null
      };

      // Persist sale updates
      const result = await salesService.updateSale(saleId, updateData);
      if (!result?.success) {
        setError(result?.error || 'Failed to save changes');
        setIsSaving(false);
        return;
      }

      // Recompute commission total based on updated fields (match calculator used elsewhere)
      const totals = commissionCalculator.calculateTotalCommission(
        updateData.sale_price,
        updateData.accessories_value,
        updateData.vehicle_type,
        updateData.warranty_selling_price,
        updateData.warranty_cost,
        updateData.service_price,
        updateData.service_cost,
        updateData.spiff_bonus
      );

      // Replace commission records for this sale (50/50 if shared)
      const replaceRes = await salesService.replaceCommissionRecordsForSale(
        saleId,
        originalSaleData?.id ? originalSaleData?.salespersonId : (result?.data?.salesperson_id || null) || null, // fallback if needed
        updateData?.is_shared_sale ? updateData?.sales_partner_id : null,
        totals?.total || 0,
        !!updateData?.is_shared_sale
      );

      if (!replaceRes?.success) {
        console.error('Failed to update commission records:', replaceRes?.error);
        // Continue but warn user
        setError('Sale saved, but failed to update commission records.');
      }

      // Update original data to reflect saved changes
      setOriginalSaleData(currentSaleData);
      navigate('/dashboard', { 
        state: { message: 'Sale updated successfully!' }
      });
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        setError('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
      } else {
        setError('Failed to save changes. Please try again.');
      }
      console.log('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!saleId || !window.confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await salesService.deleteSale(saleId);
      
      if (result?.success) {
        navigate('/dashboard', { 
          state: { message: 'Sale deleted successfully!' }
        });
      } else {
        setError(result?.error || 'Failed to delete sale');
      }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        setError('Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.');
      } else {
        setError('Failed to delete sale. Please try again.');
      }
      console.log('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const hasChanges = modifiedFields?.length > 0;

  // Loading state with proper conditional rendering
  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sale data...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state with proper conditional rendering
  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mr-2"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Only render main content when data is loaded - CRITICAL FIX
  if (!currentSaleData || !originalSaleData) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Preparing sale data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <div className="p-6">
          {/* Only render when data exists */}
          {currentSaleData && (
            <SaleHeader saleData={currentSaleData} />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Only render form when data exists */}
              {currentSaleData && (
                <EditSaleForm
                  saleData={currentSaleData}
                  onFormChange={handleFormChange}
                  modifiedFields={modifiedFields}
                />
              )}
              
              {screenshots && (
                <ScreenshotUpload
                  screenshots={screenshots}
                  onScreenshotsChange={setScreenshots}
                />
              )}
              
              {/* Only render when both data objects exist */}
              {originalSaleData && currentSaleData && modifiedFields && (
                <ChangeTracker 
                  modifiedFields={modifiedFields}
                  originalData={originalSaleData}
                  currentData={currentSaleData}
                />
              )}
              
              <ActionButtons
                onSave={handleSave}
                onDelete={handleDelete}
                onCancel={handleCancel}
                hasChanges={hasChanges}
                saving={isSaving}
                deleting={isDeleting}
              />
            </div>

            <div>
              {/* Only render when data exists */}
              {currentSaleData && originalSaleData && commissionData && (
                <CommissionSidebar
                  originalCommission={originalSaleData?.totalCommission || 0}
                  newCommission={commissionData?.total || 0}
                  commissionBreakdown={commissionData?.breakdown || []}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditSale;
