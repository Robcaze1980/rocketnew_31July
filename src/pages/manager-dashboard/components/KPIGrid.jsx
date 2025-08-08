import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import managerService from '../../../utils/managerService';

export default function KPIGrid() {
  const { user } = useAuth();
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    totalSales: 0,
    activeTeamMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null); // null = current month

  // Phase 1: Load real KPI data from Supabase
  useEffect(() => {
    let isMounted = true;

    const loadKPIData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Verify manager access
        await managerService.verifyManagerAccess(user.id);

        // Fetch real KPI data
        const data = await managerService.getManagerTeamKPIs(user.id, dateRange);
        
        if (isMounted) {
          setKpiData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load KPI data');
          console.error('KPI loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadKPIData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, dateRange]);

  // Phase 3: Real-time updates for KPI data
  useEffect(() => {
    let channel = null;

    if (user?.id) {
      channel = managerService.subscribeToTeamUpdates(user.id, () => {
        // Reload KPI data when team sales are updated
        managerService.getManagerTeamKPIs(user.id, dateRange)
          .then(data => setKpiData(data))
          .catch(err => console.error('Real-time KPI update error:', err));
      });
    }

    return () => {
      if (channel) {
        managerService.unsubscribeChannel(channel);
      }
    };
  }, [user?.id, dateRange]);

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading KPI data: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-red-600 underline text-sm mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: `$${Math.round(kpiData.totalRevenue).toLocaleString()}`,
      subtitle: 'Team sales revenue',
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Commissions',
      value: `$${Math.round(kpiData.totalCommissions).toLocaleString()}`,
      subtitle: 'Team commissions earned',
      icon: '📈',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Sales',
      value: kpiData.totalSales.toString(),
      subtitle: 'Completed sales count',
      icon: '🎯',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Active Team Members',
      value: kpiData.activeTeamMembers.toString(),
      subtitle: 'Team size',
      icon: '👥',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Department KPIs</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleDateRangeChange(null)}
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
              handleDateRangeChange({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-lg border border-gray-200 p-6`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <div className={`w-12 h-12 rounded-full ${card.bgColor} flex items-center justify-center`}>
                <span className={`text-xl ${card.color}`}>📊</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
              <p className={`text-3xl font-bold ${card.color} mb-1`}>{card.value}</p>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}