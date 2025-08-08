import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import salesService from '../../utils/salesService';
import enhancedPerformanceService from '../../utils/enhancedPerformanceService';
import Header from '../../components/ui/Header';
import { startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';

import KPICard from './components/KPICard';
import SalesSummaryTable from './components/SalesSummaryTable';
import ActivityFeed from './components/ActivityFeed';
import QuickActions from './components/QuickActions';
import TimeFilter from './components/TimeFilter';

// Chart components
import CommissionSourcesChart from './components/CommissionSourcesChart';
import CarsSoldChart from './components/CarsSoldChart';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { isAdmin } = useRoleAccess();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('current_month');
  const [performanceStats, setPerformanceStats] = useState(null);
  // Paging for recent sales list (10 per page, up to 5 pages)
  const [recentPage, setRecentPage] = useState(1);
  const recentPageSize = 10;

  // Function to calculate date ranges based on selected filter
  const calculateDateRange = (filter) => {
    const now = new Date();
    
    switch (filter) {
      case 'previous_month':
        const prevMonth = subMonths(now, 1);
        return {
          startDate: startOfMonth(prevMonth),
          endDate: endOfMonth(prevMonth)
        };
      case 'last_3_months':
        return {
          startDate: startOfMonth(subMonths(now, 2)),
          endDate: endOfMonth(now)
        };
      case 'last_6_months':
        return {
          startDate: startOfMonth(subMonths(now, 5)),
          endDate: endOfMonth(now)
        };
      case 'this_year':
        return {
          startDate: startOfYear(now),
          endDate: endOfMonth(now)
        };
      case 'current_month':
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
    }
  };

  // Memoize the user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Enhanced loading skeleton with safer array creation
  // Moved this before conditional returns to ensure consistent hook order
  const loadingSkeletonItems = useMemo(() => {
    try {
      return Array.from({ length: 4 }, (_, index) => (
        <div key={`skeleton-${index}`} className="bg-card border border-border rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/4"></div>
        </div>
      ));
    } catch (error) {
      console.error('Error creating skeleton items:', error);
      return [];
    }
  }, []);

  // Memoize utility functions to prevent recreation on every render
  const formatCurrency = useMemo(() => (amount) => {
    const value = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(value);
  }, []);

  const getChangeType = useMemo(() => (changeStr) => {
    if (!changeStr) return 'neutral';
    if (changeStr?.startsWith('+')) return 'positive';
    if (changeStr?.startsWith('-')) return 'negative';
    return 'neutral';
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Update data when time filter changes
  useEffect(() => {
    // Save user preference
    if (userId) {
      localStorage.setItem(`dashboard_time_filter_${userId}`, selectedTimeFilter);
    }
  }, [selectedTimeFilter, userId]);

  // Load saved time filter preference
  useEffect(() => {
    if (userId) {
      const savedFilter = localStorage.getItem(`dashboard_time_filter_${userId}`);
      if (savedFilter) {
        setSelectedTimeFilter(savedFilter);
      }
    }
  }, [userId]);

  // Load dashboard statistics and recent sales
  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!userId) return;

      try {
        setStatsLoading(true);
        setHasError(false);

        // Calculate date ranges based on selected filter
        const { startDate, endDate } = calculateDateRange(selectedTimeFilter);
        const startDateStr = startDate?.toISOString()?.split('T')?.[0];
        const endDateStr = endDate?.toISOString()?.split('T')?.[0];

        // For comparison, we'll always use the previous period of the same duration
        const periodDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const comparisonEndDate = new Date(startDate);
        comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
        const comparisonStartDate = new Date(comparisonEndDate);
        comparisonStartDate.setDate(comparisonStartDate.getDate() - periodDays + 1);
        
        const comparisonStartDateStr = comparisonStartDate?.toISOString()?.split('T')?.[0];
        const comparisonEndDateStr = comparisonEndDate?.toISOString()?.split('T')?.[0];

        // For admin users, get all sales stats, for regular users get their own sales
        const [currentResult, previousResult, recentCommissionsResult, performanceResult] = await Promise.all([
          isAdmin
            ? salesService?.getAllSalesStats(startDateStr, endDateStr)
            : salesService?.getSalesStats(userId, startDateStr, endDateStr),
          isAdmin
            ? salesService?.getAllSalesStats(comparisonStartDateStr, comparisonEndDateStr)
            : salesService?.getSalesStats(userId, comparisonStartDateStr, comparisonEndDateStr),
          // Use sales table directly like Sales Grid (page-based)
          salesService?.getRecentSalesForDashboardV2({
            userId,
            userRole: isAdmin ? 'admin' : (userProfile?.role || 'member'),
            page: recentPage,
            pageSize: recentPageSize,
            restrictToCurrentMonth: false
          }),
          enhancedPerformanceService.getFilteredPerformanceData(userId, {
            startDate,
            endDate
          })
        ]);

        if (!isMounted) return;

        // Enhanced data validation with explicit null checks
        const currentData = (currentResult?.success && currentResult?.data && typeof currentResult?.data === 'object') ? currentResult?.data : {
          totalCommissions: 0,
          totalSalesValue: 0,
          newCarsSold: 0,
          usedCarsSold: 0,
          totalSales: 0
        };

        const previousData = (previousResult?.success && previousResult?.data && typeof previousResult?.data === 'object') ? previousResult?.data : {
          totalCommissions: 0,
          totalSalesValue: 0,
          newCarsSold: 0,
          usedCarsSold: 0,
          totalSales: 0
        };

        // Enhanced calculateChange with better error handling
        const calculateChange = (current, previous) => {
          try {
            const currentVal = parseFloat(current) || 0;
            const previousVal = parseFloat(previous) || 0;
            
            if (previousVal === 0) return currentVal > 0 ? '+100%' : '0%';
            const change = ((currentVal - previousVal) / previousVal) * 100;
            return `${change > 0 ? '+' : ''}${change?.toFixed(1)}%`;
          } catch (error) {
            console.error('Error calculating change:', error);
            return '0%';
          }
        };

        // Enhanced sales data validation
        const salesArray = (recentCommissionsResult?.success && Array.isArray(recentCommissionsResult?.data))
          ? recentCommissionsResult?.data?.filter(row => row && typeof row === 'object')
          : [];
        
        const pendingCount = salesArray?.filter(sale => sale?.status === 'pending')?.length;

        const newStats = {
          current: {
            totalCommissions: Number(currentData?.totalCommissions) || 0,
            totalSalesValue: Number(currentData?.totalSalesValue) || 0,
            newCarsSold: Number(currentData?.newCarsSold) || 0,
            usedCarsSold: Number(currentData?.usedCarsSold) || 0,
            totalSales: Number(currentData?.totalSales) || 0
          },
          changes: {
            commissions: calculateChange(currentData?.totalCommissions, previousData?.totalCommissions),
            salesValue: calculateChange(currentData?.totalSalesValue, previousData?.totalSalesValue),
            newCars: calculateChange(currentData?.newCarsSold, previousData?.newCarsSold),
            usedCars: calculateChange(currentData?.usedCarsSold, previousData?.usedCarsSold)
          },
          pendingReviews: Number(pendingCount) || 0
        };

        setStats(newStats);
        setSalesData(salesArray);
        
        // Set performance stats
        if (performanceResult?.success) {
          setPerformanceStats(performanceResult.data);
        }

      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        setHasError(true);
        
        // Set safe fallback data
        if (isMounted) {
          setStats({
            current: {
              totalCommissions: 0,
              totalSalesValue: 0,
              newCarsSold: 0,
              usedCarsSold: 0,
              totalSales: 0
            },
            changes: {
              commissions: '0%',
              salesValue: '0%',
              newCars: '0%',
              usedCars: '0%'
            },
            pendingReviews: 0
          });
          setSalesData([]);
          setPerformanceStats(null);
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [userId, isAdmin, selectedTimeFilter, recentPage]);

  // Show error state if component encountered an error
  if (hasError) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-4">We encountered an error loading your dashboard data.</p>
              <button 
                onClick={() => window.location?.reload()} 
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Reload Page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back{userProfile?.full_name ? `, ${userProfile?.full_name}` : ''}! {isAdmin
                ? 'Here\'s an overview of the entire dealership\'s sales performance.'
                : 'Here\'s an overview of your sales performance.'
              }
            </p>
          </div>

          {/* Time Filter */}
          <div className="mb-6">
            <TimeFilter 
              selectedFilter={selectedTimeFilter}
              onFilterChange={setSelectedTimeFilter}
              loading={statsLoading}
            />
          </div>

          {/* Main Dashboard Layout - 8 Cards + Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left Side - 8 Cards in 2x2 Grid */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {statsLoading ? (
                  // Enhanced loading skeleton for 8 cards
                  Array.from({ length: 8 }, (_, index) => (
                    <div key={`skeleton-${index}`} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Row 1 */}
                    <KPICard
                      title={isAdmin ? "Total Dealership Sales" : "Total Sales Value"}
                      value={formatCurrency(stats?.current?.totalSalesValue || 0)}
                      change={stats?.changes?.salesValue || '0%'}
                      changeType={getChangeType(stats?.changes?.salesValue)}
                      icon="DollarSign"
                    />
                    <KPICard
                      title={isAdmin ? "Total Commissions Paid" : "Commission Earned"}
                      value={formatCurrency(stats?.current?.totalCommissions || 0)}
                      change={stats?.changes?.commissions || '0%'}
                      changeType={getChangeType(stats?.changes?.commissions)}
                      icon="TrendingUp"
                    />
                    <KPICard
                      title={isAdmin ? "Total Sales This Month" : "Sales This Month"}
                      value={String(stats?.current?.totalSales || 0)}
                      change={`${stats?.current?.newCarsSold || 0} new, ${stats?.current?.usedCarsSold || 0} used`}
                      changeType="neutral"
                      icon="Car"
                    />
                    <KPICard
                      title={isAdmin ? "Pending Reviews" : "Pending Reviews"}
                      value={String(stats?.pendingReviews || 0)}
                      change={stats?.pendingReviews > 0 ? 'Requires attention' : 'All caught up'}
                      changeType={stats?.pendingReviews > 0 ? 'negative' : 'positive'}
                      icon="Clock"
                    />
                    
                    {/* Row 2 - Additional cards from PerformanceStats */}
                    <KPICard
                      title="Total Commission"
                      value={formatCurrency(performanceStats?.totalCommission || 0)}
                      change="0%"
                      changeType="neutral"
                      icon="DollarSign"
                    />
                    <KPICard
                      title="Total Sales"
                      value={String(performanceStats?.totalSales || 0)}
                      change="0 new, 0 used"
                      changeType="neutral"
                      icon="Car"
                    />
                    <KPICard
                      title="Average Deal Size"
                      value={formatCurrency(performanceStats?.avgDealSize || 0)}
                      change="0%"
                      changeType="neutral"
                      icon="Calculator"
                    />
                    <KPICard
                      title="Commission Sources"
                      value={performanceStats?.breakdown ? Object.values(performanceStats.breakdown).filter(v => v > 0).length : 0}
                      subtitle="Active income streams"
                      icon="Target"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Right Side - Charts */}
            <div className="space-y-6">
              <CommissionSourcesChart />
              <CarsSoldChart />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Summary (Recent Sales, with simple paging) */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-foreground">Recent Sales</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50"
                    onClick={() => setRecentPage(p => Math.max(1, p - 1))}
                    disabled={recentPage <= 1 || statsLoading}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">Page {recentPage} / 5</span>
                  <button
                    type="button"
                    className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50"
                    onClick={() => setRecentPage(p => Math.min(5, p + 1))}
                    disabled={recentPage >= 5 || statsLoading}
                  >
                    Next
                  </button>
                </div>
              </div>
              <SalesSummaryTable salesData={Array.isArray(salesData) ? salesData : []} loading={statsLoading} />
              <p className="mt-2 text-xs text-muted-foreground">Showing up to {recentPage * recentPageSize} of 50 most recent records</p>
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              <QuickActions />
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(Dashboard);
