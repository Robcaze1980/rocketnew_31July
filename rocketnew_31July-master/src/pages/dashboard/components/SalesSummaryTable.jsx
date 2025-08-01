import React, { useMemo } from 'react';




const SalesSummaryTable = ({ salesData = [], loading = false }) => {
  // Enhanced data validation
  const safeSalesData = Array.isArray(salesData) ? salesData?.filter(sale => sale && typeof sale === 'object') : [];

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Sales</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={`loading-${index}`} className="flex items-center space-x-4">
              <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (safeSalesData?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Sales</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No sales data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Sales</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Customer</th>
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Vehicle</th>
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Amount</th>
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {safeSalesData?.map((sale, index) => {
              // Add defensive checks for each sale object
              const safeCustomerName = sale?.customer_name || 'Unknown Customer';
              const safeVehicleType = sale?.vehicle_type || 'Unknown';
              const safeSalePrice = sale?.sale_price || 0;
              const safeStatus = sale?.status || 'pending';
              const saleId = sale?.id || `sale-${index}`;

              return (
                <tr key={saleId} className="border-b border-border last:border-b-0">
                  <td className="py-3 text-sm text-foreground">{safeCustomerName}</td>
                  <td className="py-3 text-sm text-muted-foreground capitalize">{safeVehicleType}</td>
                  <td className="py-3 text-sm text-foreground">
                    ${Number(safeSalePrice)?.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      safeStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      safeStatus === 'pending'? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {safeStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(SalesSummaryTable);