import React from 'react';
import Icon from '../../../components/AppIcon';

const CommissionPreview = ({ formData, commissions, sharedSaleInfo }) => {
  const calculateBaseSaleCommission = (salePrice) => {
    const price = parseFloat(salePrice) || 0;
    if (price >= 30000) return 500;
    if (price >= 20000) return 400;
    if (price >= 10000) return 300;
    return price > 0 ? 200 : 0;
  };

  const baseSaleCommission = calculateBaseSaleCommission(formData.salePrice);
  const accessoriesCommission = commissions.accessories || 0;
  const warrantyCommission = commissions.warranty || 0;
  const maintenanceCommission = commissions.maintenance || 0;
  const spiffBonus = commissions.spiff || 0;

  const totalBeforeSplit = baseSaleCommission + accessoriesCommission + warrantyCommission + maintenanceCommission + spiffBonus;
  
  const yourPercentage = sharedSaleInfo?.isShared ? (sharedSaleInfo.yourPercentage / 100) : 1;
  const finalCommission = totalBeforeSplit * yourPercentage;

  const commissionBreakdown = [
    {
      label: 'Base Sale Commission',
      amount: baseSaleCommission,
      description: `Based on sale price of $${parseFloat(formData.salePrice || 0).toLocaleString()}`,
      icon: 'DollarSign'
    },
    {
      label: 'Accessories Commission',
      amount: accessoriesCommission,
      description: `${formData.vehicleType === 'new' ? '15%' : '20%'} of accessories value`,
      icon: 'Package'
    },
    {
      label: 'Warranty Commission',
      amount: warrantyCommission,
      description: '50% of warranty profit margin',
      icon: 'Shield'
    },
    {
      label: 'Maintenance Commission',
      amount: maintenanceCommission,
      description: '40% of service profit margin',
      icon: 'Wrench'
    },
    {
      label: 'SPIFF Bonus',
      amount: spiffBonus,
      description: 'Special incentive bonus',
      icon: 'Award'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="Calculator" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Commission Preview</h3>
      </div>

      <div className="space-y-4">
        {commissionBreakdown.map((item, index) => (
          item.amount > 0 && (
            <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
              <div className="flex items-center space-x-3">
                <Icon name={item.icon} size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground">
                ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )
        ))}

        {commissionBreakdown.every(item => item.amount === 0) && (
          <div className="text-center py-8">
            <Icon name="Calculator" size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Enter sale details to see commission calculation
            </p>
          </div>
        )}

        {totalBeforeSplit > 0 && (
          <>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Subtotal</span>
                <span className="text-sm font-semibold text-foreground">
                  ${totalBeforeSplit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {sharedSaleInfo?.isShared && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon name="Users" size={14} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">Shared Sale Split</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-blue-700">
                    <span>Your share ({sharedSaleInfo.yourPercentage}%)</span>
                    <span className="font-semibold">
                      ${finalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon name="TrendingUp" size={18} className="text-success" />
                    <span className="font-semibold text-success">Total Commission</span>
                  </div>
                  <span className="text-xl font-bold text-success">
                    ${finalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Icon name="Info" size={14} className="text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Commission Rules</p>
                  <ul className="space-y-0.5">
                    <li>• $30k+: $500 base | $20k+: $400 | $10k+: $300 | Other: $200</li>
                    <li>• Accessories: New 15% | Used 20%</li>
                    <li>• Warranty: 50% of profit | Service: 40% of profit</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CommissionPreview;