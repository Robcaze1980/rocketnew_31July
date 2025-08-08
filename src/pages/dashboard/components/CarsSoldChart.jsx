import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import salesService from '../../../utils/salesService';
import { startOfYear, endOfYear, format, eachMonthOfInterval } from 'date-fns';

const CarsSoldChart = () => {
  const { user, isAdmin } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCarsSoldData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);

        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
        const monthlyData = [];

        for (const month of months) {
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          const startDateStr = monthStart.toISOString().split('T')[0];
          const endDateStr = monthEnd.toISOString().split('T')[0];

          const result = isAdmin
            ? await salesService.getAllSalesStats(startDateStr, endDateStr)
            : await salesService.getSalesStats(user.id, startDateStr, endDateStr);

          if (result.success) {
            const data = result.data || {};
            monthlyData.push({
              month: format(month, 'MMM'),
              newCars: data.newCarsSold || 0,
              usedCars: data.usedCarsSold || 0,
              total: data.totalSales || 0
            });
          }
        }

        if (isMounted) {
          setChartData(monthlyData);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load cars sold data');
          console.error('Cars sold data error:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCarsSoldData();
    return () => { isMounted = false; };
  }, [user?.id, isAdmin]);

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
          <h3 className="text-lg font-semibold text-foreground mb-2">Cars Sold</h3>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Cars Sold by Month</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" interval={0} tickMargin={8} />
            <YAxis />
            <Tooltip formatter={(value) => [value, 'Cars']} labelFormatter={(label) => `Month: ${label}`} />
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ paddingRight: 0, marginRight: 0 }} />
            <Bar dataKey="newCars" name="New Cars" fill="#3b82f6" stackId="a" />
            <Bar dataKey="usedCars" name="Used Cars" fill="#10b981" stackId="a">
              <LabelList dataKey="total" position="top" formatter={(v) => (v || 0).toLocaleString()} style={{ fill: '#6b7280', fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CarsSoldChart;
