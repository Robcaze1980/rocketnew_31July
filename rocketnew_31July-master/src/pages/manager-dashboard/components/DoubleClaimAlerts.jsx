import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertTriangle, Clock, User, Car, DollarSign, CheckCircle, Eye, MessageSquare, Calendar } from 'lucide-react';
import managerService from '../../../utils/managerService';
import salesService from '../../../utils/salesService';

export default function DoubleClaimAlerts({ alerts, onAlertsUpdate }) {
  const { user } = useAuth();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, high, medium, low
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, priority

  const priorityColors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    low: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  };

  const filteredAndSortedAlerts = alerts
    ?.filter(alert => filter === 'all' || alert.priority === filter)
    ?.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a?.createdAt - b?.createdAt;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder?.[b?.priority] - priorityOrder?.[a?.priority];
        default: // newest
          return b?.createdAt - a?.createdAt;
      }
    }) || [];

  const handleResolveAlert = async (alert, resolution) => {
    setLoading(true);
    try {
      // Process resolution based on type
      if (resolution === 'legitimate_shared') {
        // Convert to shared sale
        const primarySale = alert.sales?.[0];
        const partnerSale = alert.sales?.[1];
        
        await salesService?.updateSale(primarySale?.id, {
          is_shared_sale: true,
          sales_partner_id: partnerSale?.salesperson_id,
          status: 'completed'
        });
        
        // Remove duplicate sale
        await salesService?.deleteSale(partnerSale?.id);
        
      } else if (resolution === 'error_correction') {
        // Mark as resolved - one sale keeps the stock number
        const keepSale = alert.sales?.find(sale => sale?.id === selectedAlert?.keepSaleId);
        const removeSales = alert.sales?.filter(sale => sale?.id !== selectedAlert?.keepSaleId);
        
        for (const sale of removeSales) {
          await salesService?.updateSale(sale?.id, {
            stock_number: `${sale?.stock_number}_CORRECTED_${Date.now()}`,
            status: 'completed'
          });
        }
      } else if (resolution === 'cancel_duplicate') {
        // Cancel duplicate sales
        const cancelSales = alert.sales?.filter(sale => sale?.id !== selectedAlert?.keepSaleId);
        
        for (const sale of cancelSales) {
          await salesService?.updateSale(sale?.id, {
            status: 'cancelled'
          });
        }
      }

      // Log resolution activity
      await managerService?.logActivity(user?.id, 'Double Claim Resolved', 
        `Resolved stock number ${alert.stockNumber} conflict via ${resolution}. Notes: ${resolutionNotes}`
      );

      // Update alerts list
      const updatedAlerts = alerts?.filter(a => a?.stockNumber !== alert.stockNumber);
      onAlertsUpdate(updatedAlerts);

      // Reset state
      setSelectedAlert(null);
      setResolutionNotes('');
      
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert('Failed to resolve alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Less than 1 hour ago';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Double Claim Alerts</h2>
          <p className="text-gray-600 mt-1">
            {alerts?.length || 0} unresolved claim conflicts requiring attention
          </p>
        </div>
        
        {/* Filters and Sort */}
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e?.target?.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e?.target?.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">By Priority</option>
          </select>
        </div>
      </div>
      {/* Alerts List */}
      {filteredAndSortedAlerts?.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-green-800">No Double Claim Alerts</h3>
          <p className="text-green-600 mt-1">
            All stock numbers are properly assigned. Great work maintaining data integrity!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedAlerts?.map((alert, index) => (
            <div
              key={`${alert.stockNumber}-${index}`}
              className={`border rounded-lg p-6 ${priorityColors?.[alert.priority]}`}
            >
              {/* Alert Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle size={24} className={alert.priority === 'high' ? 'text-red-600' : alert.priority === 'medium' ? 'text-amber-600' : 'text-yellow-600'} />
                  <div>
                    <h3 className="text-lg font-semibold">
                      Stock Number Conflict: {alert.stockNumber}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm mt-1">
                      <span className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{formatTimeAgo(alert.createdAt)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <User size={14} />
                        <span>{alert.sales?.length} salesperson{alert.sales?.length > 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                  alert.priority === 'medium'? 'bg-amber-100 text-amber-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {alert.priority?.toUpperCase()} PRIORITY
                </span>
              </div>

              {/* Conflicting Sales Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {alert.sales?.map((sale, saleIndex) => (
                  <div key={sale?.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Sale #{saleIndex + 1}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sale?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        sale?.status === 'completed'? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sale?.status?.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <User size={14} className="text-gray-400" />
                        <span><strong>Salesperson:</strong> {sale?.teamMember?.full_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User size={14} className="text-gray-400" />
                        <span><strong>Customer:</strong> {sale?.customer_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign size={14} className="text-gray-400" />
                        <span><strong>Sale Price:</strong> ${sale?.sale_price?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Car size={14} className="text-gray-400" />
                        <span><strong>Vehicle Type:</strong> {sale?.vehicle_type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span><strong>Sale Date:</strong> {new Date(sale.sale_date)?.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resolution Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedAlert(selectedAlert?.stockNumber === alert.stockNumber ? null : alert)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    <Eye size={14} />
                    <span>{selectedAlert?.stockNumber === alert.stockNumber ? 'Close' : 'Resolve Alert'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Open communication modal or redirect to team chat
                      alert('Communication feature coming soon - please contact team members directly for now.');
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    <MessageSquare size={14} />
                    <span>Contact Team</span>
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  Requires immediate manager review and resolution
                </div>
              </div>

              {/* Resolution Panel */}
              {selectedAlert?.stockNumber === alert.stockNumber && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Resolve Conflict for Stock #{alert.stockNumber}</h4>
                  
                  {/* Resolution Options */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution Notes (required):
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e?.target?.value)}
                        placeholder="Explain the resolution decision and any relevant details..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleResolveAlert(alert, 'legitimate_shared')}
                        disabled={!resolutionNotes?.trim() || loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? 'Processing...' : 'Convert to Shared Sale'}
                      </button>
                      
                      <button
                        onClick={() => handleResolveAlert(alert, 'error_correction')}
                        disabled={!resolutionNotes?.trim() || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? 'Processing...' : 'Correct Stock Numbers'}
                      </button>
                      
                      <button
                        onClick={() => handleResolveAlert(alert, 'cancel_duplicate')}
                        disabled={!resolutionNotes?.trim() || loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? 'Processing...' : 'Cancel Duplicate Sales'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}