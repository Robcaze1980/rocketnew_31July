import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import managerService from '../../../utils/managerService';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPIGrid = ({ dateRange }) => {
  const { user } = useAuth();
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    totalSales: 0,
    activeTeamMembers: 0
  });
  const [previousData, setPreviousData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadKPIData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Verify manager access
        await managerService?.verifyManagerAccess(user?.id);

        // Fetch current period data
        const currentData = await managerService?.getManagerTeamKPIs(user?.id, dateRange);
        
        // Fetch previous period for comparison
        const previousPeriodRange = getPreviousPeriodRange(dateRange);
        const previousPeriodData = await managerService?.getManagerTeamKPIs(user?.id, previousPeriodRange);
        
        if (isMounted) {
          setKpiData(currentData);
          setPreviousData(previousPeriodData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load KPI data');
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

  const getPreviousPeriodRange = (currentRange) => {
    if (!currentRange) {
      // Previous month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: startDate?.toISOString()?.split('T')?.[0],
        endDate: endDate?.toISOString()?.split('T')?.[0]
      };
    }
    
    const start = new Date(currentRange.startDate);
    const end = new Date(currentRange.endDate);
    const periodLength = end - start;
    
    return {
      startDate: new Date(start.getTime() - periodLength)?.toISOString()?.split('T')?.[0],
      endDate: new Date(start.getTime() - 1)?.toISOString()?.split('T')?.[0]
    };
  };

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change) => {
    if (change === null) return <Minus size={16} className="text-gray-400" />;
    if (change > 0) return <TrendingUp size={16} className="text-green-500" />;
    if (change < 0) return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getTrendColor = (change) => {
    if (change === null) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)]?.map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
          onClick={() => window.location?.reload()} 
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
      value: `$${Math.round(kpiData?.totalRevenue)?.toLocaleString()}`,
      subtitle: 'Department sales revenue',
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: calculateChange(kpiData?.totalRevenue, previousData?.totalRevenue)
    },
    {
      title: 'Total Commissions',
      value: `$${Math.round(kpiData?.totalCommissions)?.toLocaleString()}`,
      subtitle: 'Team commissions earned',
      icon: '📈',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: calculateChange(kpiData?.totalCommissions, previousData?.totalCommissions)
    },
    {
      title: 'Total Sales',
      value: kpiData?.totalSales?.toString(),
      subtitle: 'Completed sales count',
      icon: '🎯',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: calculateChange(kpiData?.totalSales, previousData?.totalSales)
    },
    {
      title: 'Active Team Members',
      value: kpiData?.activeTeamMembers?.toString(),
      subtitle: 'Department team size',
      icon: '👥',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: calculateChange(kpiData?.activeTeamMembers, previousData?.activeTeamMembers)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Department KPI Overview</h2>
        <div className="text-sm text-gray-500">
          Period-over-period comparison
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards?.map((card, index) => (
          <div key={index} className={`${card?.bgColor} rounded-lg border border-gray-200 p-6`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card?.icon}</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(card?.change)}
                {card?.change !== null && (
                  <span className={`text-sm font-medium ${getTrendColor(card?.change)}`}>
                    {Math.abs(card?.change)?.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{card?.title}</h3>
              <p className={`text-3xl font-bold ${card?.color} mb-1`}>{card?.value}</p>
              <p className="text-xs text-gray-500">{card?.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KPIGrid;