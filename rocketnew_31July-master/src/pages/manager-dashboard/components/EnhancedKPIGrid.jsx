import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { DollarSign, TrendingUp, Target, Users, Car, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';
import managerService from '../../../utils/managerService';
import Icon from '../../../components/AppIcon';


export default function EnhancedKPIGrid() {
  const { user } = useAuth();
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    totalSales: 0,
    activeTeamMembers: 0,
    newCarSales: 0,
    usedCarSales: 0,
    previousPeriodData: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null); // null = current month

  // Load enhanced KPI data from Supabase
  useEffect(() => {
    let isMounted = true;

    const loadEnhancedKPIData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Verify manager access
        await managerService?.verifyManagerAccess(user?.id);

        // Fetch enhanced KPI data with new/used breakdown
        const currentData = await managerService?.getEnhancedTeamKPIs(user?.id, dateRange);
        
        // Get previous period for comparison
        const previousPeriod = getPreviousPeriod(dateRange);
        const previousData = await managerService?.getEnhancedTeamKPIs(user?.id, previousPeriod);
        
        if (isMounted) {
          setKpiData({
            ...currentData,
            previousPeriodData: previousData
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load enhanced KPI data');
          console.error('Enhanced KPI loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEnhancedKPIData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, dateRange]);

  // Real-time updates for KPI data
  useEffect(() => {
    let channel = null;

    if (user?.id) {
      try {
        channel = managerService?.subscribeToTeamUpdates(user?.id, () => {
          // Reload KPI data when team sales are updated
          managerService?.getEnhancedTeamKPIs(user?.id, dateRange)?.then(data => {
            if (data) {
              setKpiData(prev => ({ ...prev, ...data }));
            }
          })?.catch(err => console.error('Real-time enhanced KPI update error:', err));
        });
      } catch (error) {
        console.error('Error setting up KPI real-time subscription:', error);
      }
    }

    return () => {
      if (channel) {
        managerService?.unsubscribeChannel(channel);
      }
    };
  }, [user?.id, dateRange]);

  const getPreviousPeriod = (currentPeriod) => {
    if (!currentPeriod) {
      // Previous month
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: prevMonth?.toISOString()?.split('T')?.[0],
        endDate: prevMonthEnd?.toISOString()?.split('T')?.[0]
      };
    }
    
    // Calculate previous period based on current period length
    const start = new Date(currentPeriod.startDate);
    const end = new Date(currentPeriod.endDate);
    const periodLength = end?.getTime() - start?.getTime();
    
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodLength);
    
    return {
      startDate: prevStart?.toISOString()?.split('T')?.[0],
      endDate: prevEnd?.toISOString()?.split('T')?.[0]
    };
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100)?.toFixed(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)]?.map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading enhanced KPI data: {error}</p>
        <button 
          onClick={() => window.location?.reload()} 
          className="text-red-600 underline text-sm mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  // Enhanced KPI cards with 6 cards including new/used breakdown
  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(kpiData?.totalRevenue),
      subtitle: 'Team sales revenue',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      change: calculatePercentageChange(kpiData?.totalRevenue, kpiData?.previousPeriodData?.totalRevenue || 0),
      trend: kpiData?.totalRevenue > (kpiData?.previousPeriodData?.totalRevenue || 0) ? 'up' : 'down'
    },
    {
      title: 'Total Commissions',
      value: formatCurrency(kpiData?.totalCommissions),
      subtitle: 'Team commissions earned',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      change: calculatePercentageChange(kpiData?.totalCommissions, kpiData?.previousPeriodData?.totalCommissions || 0),
      trend: kpiData?.totalCommissions > (kpiData?.previousPeriodData?.totalCommissions || 0) ? 'up' : 'down'
    },
    {
      title: 'Total Sales Count',
      value: kpiData?.totalSales?.toString(),
      subtitle: 'Completed sales',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      change: calculatePercentageChange(kpiData?.totalSales, kpiData?.previousPeriodData?.totalSales || 0),
      trend: kpiData?.totalSales > (kpiData?.previousPeriodData?.totalSales || 0) ? 'up' : 'down'
    },
    {
      title: 'Active Team Members',
      value: kpiData?.activeTeamMembers?.toString(),
      subtitle: 'Current team size',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      change: calculatePercentageChange(kpiData?.activeTeamMembers, kpiData?.previousPeriodData?.activeTeamMembers || 0),
      trend: kpiData?.activeTeamMembers > (kpiData?.previousPeriodData?.activeTeamMembers || 0) ? 'up' : 'down'
    },
    {
      title: 'New Car Sales',
      value: kpiData?.newCarSales?.toString(),
      subtitle: 'New vehicle sales',
      icon: Car,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      change: calculatePercentageChange(kpiData?.newCarSales, kpiData?.previousPeriodData?.newCarSales || 0),
      trend: kpiData?.newCarSales > (kpiData?.previousPeriodData?.newCarSales || 0) ? 'up' : 'down'
    },
    {
      title: 'Used Car Sales',
      value: kpiData?.usedCarSales?.toString(),
      subtitle: 'Pre-owned vehicle sales',
      icon: ShoppingCart,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      change: calculatePercentageChange(kpiData?.usedCarSales, kpiData?.previousPeriodData?.usedCarSales || 0),
      trend: kpiData?.usedCarSales > (kpiData?.previousPeriodData?.usedCarSales || 0) ? 'up' : 'down'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Date Range Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Enhanced Department KPIs</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleDateRangeChange(null)}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              !dateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                startDate: startDate?.toISOString()?.split('T')?.[0],
                endDate: endDate?.toISOString()?.split('T')?.[0]
              });
            }}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              dateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>
      {/* Enhanced KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards?.map((card, index) => {
          const Icon = card?.icon;
          const TrendIcon = card?.trend === 'up' ? ArrowUp : ArrowDown;
          const isPositiveTrend = card?.trend === 'up' || (card?.trend === 'down' && parseFloat(card?.change) === 0);
          
          return (
            <div key={index} className={`${card?.bgColor} ${card?.borderColor} rounded-lg border p-6 transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full ${card?.bgColor} flex items-center justify-center`}>
                  <Icon size={24} className={card?.color} />
                </div>
                <div className="flex items-center space-x-1">
                  <TrendIcon 
                    size={14} 
                    className={isPositiveTrend ? 'text-green-600' : 'text-red-600'} 
                  />
                  <span className={`text-sm font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(parseFloat(card?.change))}%
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{card?.title}</h3>
                <p className={`text-3xl font-bold ${card?.color} mb-1`}>{card?.value}</p>
                <p className="text-xs text-gray-500">{card?.subtitle}</p>
                <p className="text-xs text-gray-400 mt-1">
                  vs previous period
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {/* KPI Summary Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">KPI Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-gray-700">Performance Highlights:</p>
            <ul className="text-gray-600 space-y-1">
              <li>• New vs Used Car Ratio: {kpiData?.newCarSales}:{kpiData?.usedCarSales}</li>
              <li>• Average Revenue per Sale: {formatCurrency(kpiData?.totalSales > 0 ? kpiData?.totalRevenue / kpiData?.totalSales : 0)}</li>
              <li>• Commission Rate: {kpiData?.totalRevenue > 0 ? ((kpiData?.totalCommissions / kpiData?.totalRevenue) * 100)?.toFixed(1) : 0}%</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-gray-700">Team Productivity:</p>
            <ul className="text-gray-600 space-y-1">
              <li>• Sales per Team Member: {kpiData?.activeTeamMembers > 0 ? (kpiData?.totalSales / kpiData?.activeTeamMembers)?.toFixed(1) : 0}</li>
              <li>• Revenue per Team Member: {formatCurrency(kpiData?.activeTeamMembers > 0 ? kpiData?.totalRevenue / kpiData?.activeTeamMembers : 0)}</li>
              <li>• Commission per Team Member: {formatCurrency(kpiData?.activeTeamMembers > 0 ? kpiData?.totalCommissions / kpiData?.activeTeamMembers : 0)}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}