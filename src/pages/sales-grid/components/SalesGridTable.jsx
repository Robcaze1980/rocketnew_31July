import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import salesService from '../../../utils/salesService';

const SalesGridTable = ({ 
  sales = [], 
  loading = false, 
  selectedSales = [], 
  onSelectSale, 
  onSelectAll, 
  allSelected = false,
  onRefresh 
}) => {
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    const value = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleEdit = (saleId) => {
    navigate(`/edit-sale/${saleId}`);
  };

  const handleDelete = async (saleId, customerName) => {
    if (!window.confirm(`Are you sure you want to delete the sale for ${customerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await salesService.deleteSale(saleId);
      
      if (result.success) {
        // Refresh the data
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert(`Failed to delete sale: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to delete sale. Please try again.');
      console.log('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-muted rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-16 bg-muted rounded"></div>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="p-12 text-center">
        <Icon name="Car" size={48} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Sales Found</h3>
        <p className="text-muted-foreground mb-4">
          You haven't recorded any sales yet, or no sales match your current filters.
        </p>
        <Button
          onClick={() => navigate('/add-new-sale')}
          iconName="Plus"
          iconPosition="left"
        >
          Add New Sale
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/30 border-b border-border">
          <tr>
            <th className="text-left p-4">
              <input
                type="checkbox"
                checked={allSelected && sales.length > 0}
                onChange={onSelectAll}
                className="rounded border-border"
              />
            </th>
            <th className="text-left p-4 font-semibold text-foreground">Date</th>
            <th className="text-left p-4 font-semibold text-foreground">Customer</th>
            <th className="text-left p-4 font-semibold text-foreground">Stock #</th>
            <th className="text-left p-4 font-semibold text-foreground">Vehicle</th>
            <th className="text-left p-4 font-semibold text-foreground">Sale Price</th>
            <th className="text-left p-4 font-semibold text-foreground">Commission</th>
            <th className="text-left p-4 font-semibold text-foreground">Status</th>
            <th className="text-left p-4 font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale, index) => (
            <tr 
              key={sale.id} 
              className={`border-b border-border hover:bg-muted/20 ${
                index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
              }`}
            >
              <td className="p-4">
                <input
                  type="checkbox"
                  checked={selectedSales.includes(sale.id)}
                  onChange={() => onSelectSale(sale.id)}
                  className="rounded border-border"
                />
              </td>
              <td className="p-4 text-foreground">
                {formatDate(sale.date)}
              </td>
              <td className="p-4">
                <div>
                  <p className="font-medium text-foreground">{sale.customerName}</p>
                </div>
              </td>
              <td className="p-4 text-foreground font-mono text-sm">
                {sale.stockNumber}
              </td>
              <td className="p-4">
                <div className="flex items-center space-x-2">
                  <Icon
                    name={sale.vehicleType === 'new' ? 'Car' : 'Truck'}
                    size={16}
                    className="text-primary"
                  />
                  <span className="text-foreground capitalize">
                    {sale.vehicleType} Vehicle
                  </span>
                </div>
              </td>
              <td className="p-4 font-semibold text-foreground">
                {formatCurrency(sale.salePrice)}
              </td>
              <td className="p-4 font-semibold text-green-600">
                {formatCurrency(sale.commissionAmount)}
              </td>
              <td className="p-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(
                    sale.status
                  )}`}
                >
                  {sale.status}
                </span>
              </td>
              <td className="p-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(sale.id)}
                    iconName="Edit"
                    iconPosition="left"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(sale.id, sale.customerName)}
                    iconName="Trash2"
                    iconPosition="left"
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesGridTable;