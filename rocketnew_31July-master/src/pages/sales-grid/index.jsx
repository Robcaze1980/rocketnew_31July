import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import salesService from '../../utils/salesService';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import SalesGridTable from './components/SalesGridTable';
import FilterPanel from './components/FilterPanel';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import ExportModal from './components/ExportModal';

const SalesGrid = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoleAccess();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSales, setSelectedSales] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    saleType: '',
    commissionStatus: '',
    salesperson: ''
  });

  // Load sales data from Supabase
  useEffect(() => {
    let isMounted = true;

        const loadSalesData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // If user is admin, get all sales, otherwise get user's sales
        const result = isAdmin
          ? await salesService?.getAllSales()
          : await salesService?.getUserSales(user?.id);

        if (!isMounted) return;

        if (result?.success) {
          // Transform data for grid display
          const transformedData = result?.data?.map(sale => ({
            id: sale?.id,
            date: sale?.sale_date || sale?.created_at?.split('T')?.[0],
            customerName: sale?.customer_name,
            vehicleDetails: `${sale?.vehicle_type === 'new' ? 'New' : 'Used'} Vehicle`,
            stockNumber: sale?.stock_number,
            salePrice: parseFloat(sale?.sale_price) || 0,
            commissionAmount: parseFloat(sale?.commission_total) || 0,
            status: sale?.status === 'completed' ? 'Completed' :
                   sale?.status === 'pending' ? 'Pending' : 'Cancelled',
            salesperson: sale?.salesperson?.full_name || 'Unknown',
            vehicleType: sale?.vehicle_type,
            originalData: sale // Keep original data for operations
          }));

          setSalesData(transformedData);
        } else {
          setError(result?.error || 'Failed to load sales data');
        }
      } catch (error) {
        if (isMounted) {
          setError('Failed to load sales data. Please try again.');
          console.log('Error loading sales:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSalesData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isAdmin]);

  const handleSelectSale = (saleId) => {
    setSelectedSales(prev =>
      prev?.includes(saleId)
        ? prev?.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSales?.length === salesData?.length) {
      setSelectedSales([]);
    } else {
      setSelectedSales(salesData?.map(sale => sale?.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedSales?.length === 0) return;

    try {
      setLoading(true);

      if (action === 'delete') {
        if (!window.confirm(`Are you sure you want to delete ${selectedSales?.length} sales? This action cannot be undone.`)) {
          return;
        }

        // Delete selected sales
        const deletePromises = selectedSales?.map(saleId =>
          salesService?.deleteSale(saleId)
        );

        const results = await Promise.all(deletePromises);
        const failedDeletes = results?.filter(result => !result?.success);

        if (failedDeletes?.length > 0) {
          setError(`Failed to delete ${failedDeletes?.length} sales`);
        }

        // Refresh data
        const result = isAdmin
          ? await salesService?.getAllSales()
          : await salesService?.getUserSales(user?.id);
        if (result?.success) {
          const transformedData = result?.data?.map(sale => ({
            id: sale?.id,
            date: sale?.sale_date || sale?.created_at?.split('T')?.[0],
            customerName: sale?.customer_name,
            vehicleDetails: `${sale?.vehicle_type === 'new' ? 'New' : 'Used'} Vehicle`,
            stockNumber: sale?.stock_number,
            salePrice: parseFloat(sale?.sale_price) || 0,
            commissionAmount: parseFloat(sale?.commission_total) || 0,
            status: sale?.status === 'completed' ? 'Completed' :
                   sale?.status === 'pending' ? 'Pending' : 'Cancelled',
            salesperson: sale?.salesperson?.full_name || 'Unknown',
            vehicleType: sale?.vehicle_type,
            originalData: sale
          }));
          setSalesData(transformedData);
        }
      }

      setSelectedSales([]);
    } catch (error) {
      setError('Bulk action failed. Please try again.');
      console.log('Bulk action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const filteredSales = salesData?.filter(sale => {
    const matchesSearch = searchTerm === '' ||
      sale?.customerName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      sale?.vehicleDetails?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      sale?.stockNumber?.toLowerCase()?.includes(searchTerm?.toLowerCase());

    const matchesFilters =
      (!filters?.saleType || sale?.vehicleType === filters?.saleType) &&
      (!filters?.commissionStatus || sale?.status === filters?.commissionStatus) &&
      (!filters?.salesperson || sale?.salesperson === filters?.salesperson);

    return matchesSearch && matchesFilters;
  });

  const totalPages = Math.ceil(filteredSales?.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSales = filteredSales?.slice(startIndex, startIndex + pageSize);

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location?.reload()}>
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sales Grid</h1>
              <p className="text-muted-foreground">
                {isAdmin
                  ? 'View and manage all sales records across the entire dealership' :'Manage and track all sales records with advanced filtering and bulk operations'
                }
              </p>
            </div>
            <Button
              onClick={() => window.location.href = '/add-new-sale'}
              iconName="Plus"
              iconPosition="left"
            >
              Add New Sale
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by customer name, vehicle, or stock number..."
                value={searchTerm}
                onChange={(e) => handleSearch(e?.target?.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              iconName="Filter"
              iconPosition="left"
            >
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
              iconName="Download"
              iconPosition="left"
            >
              Export
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <FilterPanel
              filters={filters}
              onApplyFilters={handleApplyFilters}
              onClose={() => setShowFilterPanel(false)}
            />
          )}

          {/* Bulk Actions Toolbar */}
          {selectedSales?.length > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedSales?.length}
              onBulkAction={handleBulkAction}
              onClearSelection={() => setSelectedSales([])}
            />
          )}
        </div>

        {/* Sales Grid Table */}
        <div className="bg-card border border-border rounded-lg shadow-soft">
          <SalesGridTable
            sales={paginatedSales}
            loading={loading}
            selectedSales={selectedSales}
            onSelectSale={handleSelectSale}
            onSelectAll={handleSelectAll}
            allSelected={selectedSales?.length === salesData?.length}
            onRefresh={() => window.location?.reload()}
          />

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e?.target?.value));
                    setCurrentPage(1);
                  }}
                  className="border border-border rounded px-2 py-1 text-sm bg-background"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {startIndex + 1}-{Math.min(startIndex + pageSize, filteredSales?.length)} of {filteredSales?.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  iconName="ChevronLeft"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  iconName="ChevronRight"
                />
              </div>
            </div>
          )}
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <ExportModal
            salesData={filteredSales}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </main>
    </div>
  );
};

export default SalesGrid;
