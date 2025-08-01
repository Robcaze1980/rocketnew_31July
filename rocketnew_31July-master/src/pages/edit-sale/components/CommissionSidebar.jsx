import React from 'react';
import Icon from '../../../components/AppIcon';

const CommissionSidebar = ({ originalCommission, newCommission, commissionBreakdown }) => {
  // Enhanced safe defaults with additional validation
  const safeOriginalCommission = (originalCommission !== undefined && originalCommission !== null && !isNaN(originalCommission)) ? Number(originalCommission) : 0;
  const safeNewCommission = (newCommission !== undefined && newCommission !== null && !isNaN(newCommission)) ? Number(newCommission) : 0;
  const safeCommissionBreakdown = Array.isArray(commissionBreakdown) ? commissionBreakdown : [];
  
  const difference = safeNewCommission - safeOriginalCommission;
  const percentageChange = (safeOriginalCommission > 0 && typeof safeOriginalCommission === 'number' && typeof difference === 'number') 
    ? ((difference / safeOriginalCommission) * 100) 
    : 0;

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    // Handle all possible falsy values
    if (value === null || value === undefined || value === '') return '0';
    
    // Convert to number and check if it's valid
    const numValue = Number(value);
    
    // Check if the converted value is a valid number
    if (isNaN(numValue) || !isFinite(numValue)) return '0';
    
    // Format the number with toLocaleString
    try {
      return numValue.toLocaleString();
    } catch (error) {
      // Fallback in case toLocaleString fails for any reason
      return '0';
    }
  };

  const getDifferenceColor = (diff) => {
    if (diff > 0) return 'text-success';
    if (diff < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getDifferenceIcon = (diff) => {
    if (diff > 0) return 'TrendingUp';
    if (diff < 0) return 'TrendingDown';
    return 'Minus';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon name="Calculator" size={20} />
        Commission Calculator
      </h3>

      {/* Commission Comparison */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
          <span className="text-sm text-muted-foreground">Original</span>
          <span className="font-medium text-foreground">
            ${formatCurrency(safeOriginalCommission)}
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md">
          <span className="text-sm text-foreground font-medium">New Total</span>
          <span className="font-semibold text-foreground">
            ${formatCurrency(safeNewCommission)}
          </span>
        </div>

        <div className={`flex justify-between items-center p-3 rounded-md border ${
          difference > 0 ? 'bg-success/10 border-success/20' : 
          difference < 0 ? 'bg-destructive/10 border-destructive/20': 'bg-muted/50 border-border'
        }`}>
          <span className="text-sm font-medium">Difference</span>
          <div className="flex items-center gap-2">
            <Icon name={getDifferenceIcon(difference)} size={16} className={getDifferenceColor(difference)} />
            <span className={`font-semibold ${getDifferenceColor(difference)}`}>
              {difference >= 0 ? '+' : ''}${formatCurrency(Math.abs(difference))}
            </span>
            {typeof percentageChange === 'number' && !isNaN(percentageChange) && Math.abs(percentageChange) > 0 && (
              <span className={`text-xs ${getDifferenceColor(difference)}`}>
                ({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Breakdown</h4>
        {safeCommissionBreakdown.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{item?.label || 'Unknown'}</span>
            <span className="font-medium text-foreground">${formatCurrency(item?.amount)}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-border">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-smooth">
          <Icon name="Download" size={16} />
          Export Commission Report
        </button>
      </div>
    </div>
  );
};

export default CommissionSidebar;
