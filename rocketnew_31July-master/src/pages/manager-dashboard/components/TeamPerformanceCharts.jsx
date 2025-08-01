import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import managerService from '../../../utils/managerService';


export default function TeamPerformanceCharts() {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // Phase 2: Load real performance analytics data
  useEffect(() => {
    let isMounted = true;

    const loadPerformanceData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Verify manager access
        await managerService?.verifyManagerAccess(user?.id);

        // Fetch real performance data
        const [teamData, trendsData] = await Promise.all([
          managerService?.getTeamPerformanceData(user?.id, dateRange),
          managerService?.getMonthlyTrends(user?.id, 6)
        ]);

        if (isMounted) {
          setPerformanceData(teamData);
          setMonthlyTrends(trendsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load performance data');
          console.error('Performance data loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPerformanceData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, dateRange]);

  // Phase 3: Real-time updates for performance charts
  useEffect(() => {
    let channel = null;

    if (user?.id) {
      channel = managerService?.subscribeToTeamUpdates(user?.id, () => {
        // Reload performance data when team sales are updated
        Promise.all([
          managerService?.getTeamPerformanceData(user?.id, dateRange),
          managerService?.getMonthlyTrends(user?.id, 6)
        ])?.then(([teamData, trendsData]) => {
          setPerformanceData(teamData);
          setMonthlyTrends(trendsData);
        })?.catch(err => console.error('Real-time performance update error:', err));
      });
    }

    return () => {
      if (channel) {
        managerService?.unsubscribeChannel(channel);
      }
    };
  }, [user?.id, dateRange]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)]?.map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading performance charts: {error}</p>
        <button
          onClick={() => window.location?.reload()}
          className="text-red-600 underline text-sm mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare commission breakdown data for pie chart
  const getCommissionBreakdownData = () => {
    const totalBreakdown = performanceData?.reduce((acc, member) => {
      acc.sale += member?.commissionBreakdown?.sale;
      acc.accessories += member?.commissionBreakdown?.accessories;
      acc.warranty += member?.commissionBreakdown?.warranty;
      acc.service += member?.commissionBreakdown?.service;
      acc.spiff += member?.commissionBreakdown?.spiff;
      return acc;
    }, { sale: 0, accessories: 0, warranty: 0, service: 0, spiff: 0 });

    return [
      { name: 'Sale Commission', value: totalBreakdown?.sale, color: '#3B82F6' },
      { name: 'Accessories', value: totalBreakdown?.accessories, color: '#10B981' },
      { name: 'Warranty', value: totalBreakdown?.warranty, color: '#F59E0B' },
      { name: 'Service', value: totalBreakdown?.service, color: '#EF4444' },
      { name: 'SPIFF Bonus', value: totalBreakdown?.spiff, color: '#8B5CF6' }
    ]?.filter(item => item?.value > 0);
  };

  const commissionBreakdownData = getCommissionBreakdownData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange(null)}
            className={`px-3 py-2 text-sm rounded-md ${
              !dateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
              const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              setDateRange({
                startDate: startDate?.toISOString()?.split('T')?.[0],
                endDate: endDate?.toISOString()?.split('T')?.[0]
              });
            }}
            className={`px-3 py-2 text-sm rounded-md ${
              dateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance Bar Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === 'totalCommissions' ? `$${Math.round(value)?.toLocaleString()}` :
                  name === 'totalRevenue' ? `$${Math.round(value)?.toLocaleString()}` :
                  value,
                  name === 'totalCommissions' ? 'Total Commissions' :
                  name === 'totalRevenue' ? 'Total Revenue' :
                  name === 'totalSales' ? 'Total Sales' : name
                ]}
              />
              <Legend />
              <Bar dataKey="totalCommissions" fill="#3B82F6" name="Commissions" />
              <Bar dataKey="totalSales" fill="#10B981" name="Sales Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Commission Breakdown Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={commissionBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100)?.toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {commissionBreakdownData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry?.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${Math.round(value)?.toLocaleString()}`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends Line Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const [year, month] = value?.split('-');
                  return `${month}/${year?.substring(2)}`;
                }}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? `$${Math.round(value)?.toLocaleString()}` :
                  name === 'commissions' ? `$${Math.round(value)?.toLocaleString()}` :
                  value,
                  name === 'revenue' ? 'Revenue' :
                  name === 'commissions' ? 'Commissions' :
                  name === 'salesCount' ? 'Sales' : name
                ]}
                labelFormatter={(value) => {
                  const [year, month] = value?.split('-');
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return `${monthNames?.[parseInt(month) - 1]} ${year}`;
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" />
              <Line type="monotone" dataKey="commissions" stroke="#10B981" name="Commissions" />
              <Line type="monotone" dataKey="salesCount" stroke="#F59E0B" name="Sales Count" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
