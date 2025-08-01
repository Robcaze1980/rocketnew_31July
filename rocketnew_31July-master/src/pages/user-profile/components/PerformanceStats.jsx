import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import Icon from '../../../components/AppIcon';
import { useAuth } from '../../../contexts/AuthContext';
import PerformanceFilters from './PerformanceFilters';
import CommissionBreakdown from './CommissionBreakdown';
import PerformanceTrends from './PerformanceTrends';
import GoalTracking from './GoalTracking';
import enhancedPerformanceService from '../../../utils/enhancedPerformanceService';

const PerformanceStats = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [goalsData, setGoalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    selectedFilter: 'this_month',
    comparisonMode: false,
    commissionSources: []
  });

  // Load saved filter preferences on component mount
  useEffect(() => {
    let isMounted = true;

    const loadFilterPreferences = async () => {
      if (!user?.id) return;

      try {
        const result = await enhancedPerformanceService.getFilterPreferences(user.id);
        if (result.success && result.data && isMounted) {
          setFilters(prevFilters => ({
            ...prevFilters,
            ...result.data
          }));
        }
      } catch (error) {
        console.log('Failed to load filter preferences:', error);
      }
    };

    loadFilterPreferences();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Fetch performance data when filters change
  useEffect(() => {
    let isMounted = true;

    const fetchPerformanceData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Save current filter preferences
        await enhancedPerformanceService.saveFilterPreferences(user.id, filters);

        // Fetch filtered performance data
        const [performanceResult, trendsResult, goalsResult] = await Promise.all([
          enhancedPerformanceService.getFilteredPerformanceData(user.id, filters),
          enhancedPerformanceService.getPerformanceTrends(user.id, filters),
          enhancedPerformanceService.getGoalData(user.id)
        ]);

        if (!isMounted) return;

        if (performanceResult.success) {
          setPerformanceData(performanceResult.data);
        } else {
          setError(performanceResult.error);
        }

        if (trendsResult.success) {
          setTrendsData(trendsResult.data);
        }

        if (goalsResult.success) {
          setGoalsData(goalsResult.data);
        }

      } catch (err) {
        if (isMounted) {
          setError('Failed to load performance data');
          console.log('Performance data error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPerformanceData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleUpdateGoal = async (goalId, targetValue) => {
    if (!user?.id) return;

    try {
      const result = await enhancedPerformanceService.saveUserGoal(user.id, goalId, targetValue);
      if (result.success) {
        // Refresh goals data
        const goalsResult = await enhancedPerformanceService.getGoalData(user.id);
        if (goalsResult.success) {
          setGoalsData(goalsResult.data);
        }
      }
    } catch (error) {
      console.log('Failed to update goal:', error);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, trend, loading: cardLoading }) => (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
      {cardLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-muted rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Icon name={icon} size={20} className="text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            </div>
            {trend !== null && trend !== undefined && (
              <div className={`flex items-center space-x-1 ${trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Icon name={trend > 0 ? 'TrendingUp' : trend < 0 ? 'TrendingDown' : 'Minus'} size={16} />
                <span className="text-xs font-medium">{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Performance Overview</h3>
          <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
            <div className="text-center">
              <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">Unable to Load Performance Data</h4>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Icon name="RefreshCw" size={16} className="mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate trends for comparison
  const getTrendValue = (current, comparison) => {
    if (!comparison || !filters.comparisonMode) return null;
    if (comparison === 0) return current > 0 ? 100 : 0;
    return ((current - comparison) / comparison) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Performance Filters */}
      <PerformanceFilters 
        onFilterChange={handleFilterChange}
        currentFilters={filters}
      />

      {/* Performance Overview */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={filters.comparisonMode ? "Period Commission" : "Total Commission"}
            value={`$${performanceData?.totalCommission?.toLocaleString() || 0}`}
            subtitle={`From ${filters.commissionSources?.length > 0 ? filters.commissionSources.join(', ') : 'all sources'}`}
            icon="DollarSign"
            trend={getTrendValue(performanceData?.totalCommission || 0, performanceData?.comparisonData?.totalCommission)}
            loading={loading}
          />
          
          <StatCard
            title="Total Sales"
            value={performanceData?.totalSales || 0}
            subtitle="Vehicles sold in period"
            icon="Car"
            trend={getTrendValue(performanceData?.totalSales || 0, performanceData?.comparisonData?.totalSales)}
            loading={loading}
          />
          
          <StatCard
            title="Average Deal Size"
            value={`$${performanceData?.avgDealSize?.toLocaleString() || 0}`}
            subtitle="Per vehicle average"
            icon="Calculator"
            trend={getTrendValue(performanceData?.avgDealSize || 0, performanceData?.comparisonData?.avgDealSize)}
            loading={loading}
          />

          <StatCard
            title="Commission Sources"
            value={performanceData?.breakdown ? Object.values(performanceData.breakdown).filter(v => v > 0).length : 0}
            subtitle="Active income streams"
            icon="Target"
            loading={loading}
          />
        </div>
      </div>

      {/* Commission Breakdown */}
      {performanceData && (
        <CommissionBreakdown 
          data={performanceData}
          comparisonData={performanceData.comparisonData}
          isComparison={filters.comparisonMode}
        />
      )}

      {/* Performance Trends */}
      <PerformanceTrends 
        trendsData={trendsData}
        loading={loading}
      />

      {/* Goal Tracking */}
      {goalsData && (
        <GoalTracking 
          goalsData={goalsData}
          onUpdateGoal={handleUpdateGoal}
        />
      )}

      {/* No data fallback */}
      {!loading && (!performanceData || performanceData.totalCommission === 0) && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
          <div className="text-center">
            <Icon name="BarChart3" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Performance Data</h4>
            <p className="text-muted-foreground mb-4">
              No sales data found for the selected period. Complete your first sale to see your performance metrics.
            </p>
            <p className="text-sm text-muted-foreground">
              Selected period: {filters.startDate?.toLocaleDateString()} - {filters.endDate?.toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceStats;