import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import enhancedPerformanceService from '../../../utils/enhancedPerformanceService';
import { startOfYear, endOfYear, format, eachMonthOfInterval } from 'date-fns';

const CommissionSourcesChart = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCommissionData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get data for the current year
        const now = new Date();
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);

        // Generate monthly data points
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
        
        const monthlyData = [];
        
        // Fetch data for each month
        for (const month of months) {
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          
          const result = await enhancedPerformanceService.getFilteredPerformanceData(user.id, {
            startDate: monthStart,
            endDate: monthEnd
          });

          if (result.success) {
            const breakdown = result.data.breakdown || {};
            monthlyData.push({
              month: format(month, 'MMM'),
              carSales: breakdown.car_sales || 0,
              accessories: breakdown.accessories || 0,
              warranties: breakdown.warranties || 0,
              maintenance: breakdown.maintenance || 0,
              spiff: breakdown.spiff || 0,
              total: result.data.totalCommission || 0
            });
          }
        }

        if (isMounted) {
          setChartData(monthlyData);
        }

      } catch (err) {
        if (isMounted) {
          setError('Failed to load commission data');
          console.error('Commission data error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCommissionData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Commission Sources</h3>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Commission Sources by Month</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" interval={0} tickMargin={8} />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ paddingRight: 0 }} />
            <Bar dataKey="carSales" name="Car Sales" fill="#3b82f6" stackId="a">
              {/* Show total commission value at top of each stacked bar using the last Bar's LabelList */}
            </Bar>
            <Bar dataKey="accessories" name="Accessories" fill="#10b981" stackId="a" />
            <Bar dataKey="warranties" name="Warranties" fill="#f59e0b" stackId="a" />
            <Bar dataKey="maintenance" name="Maintenance" fill="#8b5cf6" stackId="a" />
            <Bar dataKey="spiff" name="SPIFF Bonuses" fill="#ef4444" stackId="a">
              <LabelList dataKey="total" position="top" formatter={(v) => `$${(v || 0).toLocaleString()}`} style={{ fill: '#6b7280', fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CommissionSourcesChart;
