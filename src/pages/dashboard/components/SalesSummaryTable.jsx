import React from 'react';

const PARTNER_NAME_BY_ID = {
  '2ec0a27d-529d-46ae-92fd-7c27c70d45f2': 'Ramon Gutierrez',
  '54c5cb1c-d3fc-4b17-ab31-c1e3f0fa2dca': 'Miguel Chavez',
  '6a56062b-8160-4184-a1ab-87b76dd09e48': 'Robertson Carrillo Z.',
  'a053bf25-1bf5-4f78-86a6-df4bcb463057': 'Yassir A. Carranza Solorzano',
  'be167497-264e-47be-960b-d239759baea7': 'Alejandro Gutierrez',
  'c61d52e2-dfc8-4694-9559-eab516c62a55': 'Cristopher Zarate',
  'c79b54c0-f98e-477c-93f1-f6ba77588aef': 'Danny Abdalah',
  'f290131a-8f71-4d1c-9b00-b40039a78820': 'Eli Abdalah'
};

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

  // Formatters
  const formatDate = (d) => {
    try {
      if (!d) return '—';
      const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
      return new Intl.DateTimeFormat(undefined, { month: '2-digit', day: '2-digit', year: 'numeric' }).format(date);
    } catch {
      return '—';
    }
  };

  const formatCurrency = (v) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(v || 0));
    } catch {
      return `$${Number(v || 0).toLocaleString()}`;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Sales</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Sale Date</th>
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Vehicle</th>
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Customer</th>
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Total Commission</th>
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Shared</th>
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">Sales Partner</th>
            </tr>
          </thead>
          <tbody>
            {safeSalesData?.slice(0, 10)?.map((sale, index) => {
              const saleId = sale?.id || `sale-${index}`;
              const vehicleDisplay = sale?.stock_number || sale?.vehicle || '—';
              const saleDate = sale?.sale_date || sale?.date;
              const customerName = sale?.customer_name || sale?.customerName || '—';

              // Prefer per-user commission amount when present (commissions-driven data)
              const commissionTotal = (sale?.amount != null)
                ? Number(sale?.amount || 0)
                : Number(sale?.commission_total ?? sale?.commissionTotal ?? 0);

              const isShared = !!sale?.is_shared_sale || !!sale?.isShared;

              // Compute correct counterpart name for shared sales
              // If the service included counterpart_name (based on role), prefer that.
              // Else fall back to partner_name, then static map by sales_partner_id.
              const salesPartnerId = sale?.sales_partner_id || sale?.salesPartnerId || null;
              const counterpartName = sale?.counterpart_name || null;
              const partnerNameFromRow = sale?.partner_name || sale?.partnerName || null;
              const salesPartnerName =
                counterpartName ||
                partnerNameFromRow ||
                PARTNER_NAME_BY_ID[salesPartnerId] ||
                null;

              return (
                <tr key={saleId} className="border-b border-border last:border-b-0">
                  <td className="py-3 text-sm text-foreground">{formatDate(saleDate)}</td>
                  <td className="py-3 text-sm text-foreground">{vehicleDisplay}</td>
                  <td className="py-3 text-sm text-foreground">{customerName}</td>
                  <td className="py-3 text-sm text-foreground">{formatCurrency(commissionTotal)}</td>
                  <td className="py-3 text-sm text-foreground">{isShared ? 'Yes' : 'No'}</td>
                  <td className="py-3 text-sm text-foreground">
                    {isShared ? (salesPartnerName || '—') : '—'}
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
