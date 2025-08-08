import React from 'react';
import Icon from '../../../components/AppIcon';

const SaleHeader = ({ saleData }) => {
  // Safe format date with null checks
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'draft':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Early return with null check - CRITICAL FIX
  if (!saleData) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading sale header...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-foreground">
              Sale #{saleData?.id || 'N/A'}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(saleData?.status || 'draft')}`}>
              {(saleData?.status || 'draft').charAt(0).toUpperCase() + (saleData?.status || 'draft').slice(1)}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Calendar" size={16} />
              <span>Created: {formatDate(saleData?.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Clock" size={16} />
              <span>Modified: {formatDate(saleData?.lastModified)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="User" size={16} />
              <span>Customer: {saleData?.customerName || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-smooth">
            <Icon name="History" size={16} />
            <span>Edit History</span>
          </button>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Commission</div>
            <div className="text-lg font-semibold text-foreground">
              ${(saleData?.totalCommission || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleHeader;