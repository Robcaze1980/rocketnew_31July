import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import salesService from '../../utils/salesService';
import Header from '../../components/ui/Header';

import KPICard from './components/KPICard';
import SalesSummaryTable from './components/SalesSummaryTable';
import ActivityFeed from './components/ActivityFeed';
import QuickActions from './components/QuickActions';

// Performance components
import PerformanceStats from '../user-profile/components/PerformanceStats';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { isAdmin } = useRoleAccess();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [hasError, setHasError] = useState(false);

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

  // Load dashboard statistics and recent sales
  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!userId) return;

      try {
        setStatsLoading(true);
        setHasError(false);

        // Get current month dates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startOfMonthStr = startOfMonth?.toISOString()?.split('T')?.[0];
        const endOfMonthStr = endOfMonth?.toISOString()?.split('T')?.[0];

        // Get previous month dates for comparison
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startOfPrevMonthStr = startOfPrevMonth?.toISOString()?.split('T')?.[0];
        const endOfPrevMonthStr = endOfPrevMonth?.toISOString()?.split('T')?.[0];

        // For admin users, get all sales stats, for regular users get their own sales
        const [currentResult, previousResult, recentSalesResult] = await Promise.all([
          isAdmin
            ? salesService?.getAllSalesStats(startOfMonthStr, endOfMonthStr)
            : salesService?.getSalesStats(userId, startOfMonthStr, endOfMonthStr),
          isAdmin
            ? salesService?.getAllSalesStats(startOfPrevMonthStr, endOfPrevMonthStr)
            : salesService?.getSalesStats(userId, startOfPrevMonthStr, endOfPrevMonthStr),
          isAdmin
            ? salesService?.getAllSales(10)
            : salesService?.getUserSales(userId, 10)
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
        const salesArray = (recentSalesResult?.success && recentSalesResult?.data && Array.isArray(recentSalesResult?.data)) 
          ? recentSalesResult?.data?.filter(sale => sale && typeof sale === 'object')
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
  }, [userId, isAdmin]);

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

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              // Enhanced loading skeleton
              loadingSkeletonItems
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Performance Stats */}
          <div className="mb-8">
            <PerformanceStats />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Summary */}
            <div className="lg:col-span-2">
              <SalesSummaryTable salesData={Array.isArray(salesData) ? salesData : []} loading={statsLoading} />
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
