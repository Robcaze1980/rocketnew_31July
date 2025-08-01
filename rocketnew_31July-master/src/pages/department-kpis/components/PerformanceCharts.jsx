import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import managerService from '../../../utils/managerService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceCharts = ({ dateRange, showTrends = false }) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    let isMounted = true;

    const loadChartData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const monthsToShow = showTrends ? 12 : 6;
        const trendsData = await managerService?.getMonthlyTrends(user?.id, monthsToShow);
        
        // Format data for charts
        const formattedData = trendsData?.map(item => ({
          month: new Date(item.month + '-01')?.toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit' 
          }),
          revenue: Math.round(item?.revenue),
          commissions: Math.round(item?.commissions),
          sales: item?.salesCount,
          avgSaleValue: item?.salesCount > 0 ? Math.round(item?.revenue / item?.salesCount) : 0
        }));
        
        if (isMounted) {
          setChartData(formattedData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load chart data');
          console.error('Chart data loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChartData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, dateRange, showTrends]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading chart data: {error}</p>
        </div>
      </div>
    );
  }

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {showTrends ? 'Performance Trends (12 Months)' : 'Recent Performance (6 Months)'}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-sm rounded ${
              chartType === 'line' ?'bg-blue-600 text-white' :'bg-gray-200 text-gray-700'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm rounded ${
              chartType === 'bar' ?'bg-blue-600 text-white' :'bg-gray-200 text-gray-700'
            }`}
          >
            Bar
          </button>
        </div>
      </div>
      {chartData?.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No performance data available for the selected period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'revenue' || name === 'commissions' || name === 'avgSaleValue') {
                  return [`$${value?.toLocaleString()}`, name];
                }
                return [value, name];
              }}
            />
            <Legend />
            
            {chartType === 'line' ? (
              <>
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="commissions" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Commissions"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Sales Count"
                />
              </>
            ) : (
              <>
                <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar yAxisId="left" dataKey="commissions" fill="#3b82f6" name="Commissions" />
                <Bar yAxisId="right" dataKey="sales" fill="#8b5cf6" name="Sales Count" />
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PerformanceCharts;