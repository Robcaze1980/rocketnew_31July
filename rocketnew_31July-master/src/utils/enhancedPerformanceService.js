import { supabase } from './supabase';
import performanceService from './performanceService';
import { startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';

const enhancedPerformanceService = {
  // Get filtered performance data with comparison support
  getFilteredPerformanceData: async (userId, filters) => {
    try {
      const { startDate, endDate, comparisonMode, commissionSources } = filters;
      
      if (!startDate || !endDate) {
        return { success: false, error: 'Start date and end date are required' };
      }

      // Format dates for SQL
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch sales data for the period
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .or(`salesperson_id.eq.${userId},sales_partner_id.eq.${userId}`)
        .eq('status', 'completed')
        .gte('sale_date', startDateStr)
        .lte('sale_date', endDateStr);

      if (salesError) {
        return { success: false, error: salesError.message };
      }

      // Calculate commission breakdown
      const breakdown = {
        car_sales: 0,
        warranties: 0,
        maintenance: 0,
        accessories: 0,
        spiff: 0
      };

      let totalCommission = 0;
      let totalSales = salesData?.length || 0;
      let totalSaleValue = 0;

      salesData?.forEach(sale => {
        const isShared = sale.is_shared_sale;
        const multiplier = isShared ? 0.5 : 1;

        // Apply commission source filters
        if (!commissionSources || commissionSources.length === 0 || commissionSources.includes('car_sales')) {
          breakdown.car_sales += parseFloat(sale.commission_sale || 0) * multiplier;
        }
        if (!commissionSources || commissionSources.length === 0 || commissionSources.includes('warranties')) {
          breakdown.warranties += parseFloat(sale.commission_warranty || 0) * multiplier;
        }
        if (!commissionSources || commissionSources.length === 0 || commissionSources.includes('maintenance')) {
          breakdown.maintenance += parseFloat(sale.commission_service || 0) * multiplier;
        }
        if (!commissionSources || commissionSources.length === 0 || commissionSources.includes('accessories')) {
          breakdown.accessories += parseFloat(sale.commission_accessories || 0) * multiplier;
        }
        if (!commissionSources || commissionSources.length === 0 || commissionSources.includes('spiff')) {
          breakdown.spiff += parseFloat(sale.spiff_bonus || 0) * multiplier;
        }

        totalSaleValue += parseFloat(sale.sale_price || 0);
      });

      totalCommission = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
      const avgDealSize = totalSales > 0 ? totalSaleValue / totalSales : 0;

      let comparisonData = null;
      if (comparisonMode) {
        // Calculate comparison period (same duration, previous period)
        const periodDays = differenceInDays(endDate, startDate) + 1;
        const comparisonEndDate = new Date(startDate);
        comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
        const comparisonStartDate = new Date(comparisonEndDate);
        comparisonStartDate.setDate(comparisonStartDate.getDate() - periodDays + 1);

        const comparisonResult = await enhancedPerformanceService.getFilteredPerformanceData(
          userId, 
          {
            ...filters,
            startDate: comparisonStartDate,
            endDate: comparisonEndDate,
            comparisonMode: false
          }
        );

        if (comparisonResult.success) {
          comparisonData = comparisonResult.data;
        }
      }

      return {
        success: true,
        data: {
          totalCommission,
          totalSales,
          avgDealSize,
          breakdown,
          salesData,
          comparisonData
        }
      };

    } catch (error) {
      return { success: false, error: 'Failed to fetch filtered performance data' };
    }
  },

  // Get performance trends data
  getPerformanceTrends: async (userId, filters) => {
    try {
      const { startDate, endDate } = filters;
      
      if (!startDate || !endDate) {
        return { success: false, error: 'Date range is required' };
      }

      // Generate monthly periods within the date range
      const trends = [];
      let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      while (currentDate <= endMonth) {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const periodLabel = format(currentDate, 'MMM yyyy');

        // Get data for this month
        const monthResult = await enhancedPerformanceService.getFilteredPerformanceData(
          userId,
          {
            startDate: monthStart,
            endDate: monthEnd,
            comparisonMode: false,
            commissionSources: filters.commissionSources
          }
        );

        if (monthResult.success) {
          trends.push({
            period: periodLabel,
            commission: monthResult.data.totalCommission,
            salesVolume: monthResult.data.totalSales,
            avgDealSize: monthResult.data.avgDealSize
          });
        }

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return { success: true, data: trends };

    } catch (error) {
      return { success: false, error: 'Failed to fetch trends data' };
    }
  },

  // Get goal tracking data
  getGoalData: async (userId) => {
    try {
      // Get current month performance for goal tracking
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const performanceResult = await enhancedPerformanceService.getFilteredPerformanceData(
        userId,
        {
          startDate: monthStart,
          endDate: monthEnd,
          comparisonMode: false,
          commissionSources: []
        }
      );

      if (!performanceResult.success) {
        return { success: false, error: performanceResult.error };
      }

      // Get additional performance metrics
      const basicPerformanceResult = await performanceService.getUserPerformanceData(userId);
      
      return {
        success: true,
        data: {
          monthlyCommission: performanceResult.data.totalCommission,
          monthlySales: performanceResult.data.totalSales,
          conversionRate: basicPerformanceResult.success ? basicPerformanceResult.data.conversionRate : 0,
          customerSatisfaction: basicPerformanceResult.success ? basicPerformanceResult.data.customerSatisfaction : 0
        }
      };

    } catch (error) {
      return { success: false, error: 'Failed to fetch goal data' };
    }
  },

  // Save user goal preferences (mock implementation - in real app, save to user_profiles or separate goals table)
  saveUserGoal: async (userId, goalId, targetValue) => {
    try {
      // In a real implementation, you would save this to the database
      // For now, we'll store in localStorage as a temporary solution
      const goals = JSON.parse(localStorage.getItem(`user_goals_${userId}`) || '{}');
      goals[goalId] = targetValue;
      localStorage.setItem(`user_goals_${userId}`, JSON.stringify(goals));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to save goal' };
    }
  },

  // Get user goal preferences
  getUserGoals: async (userId) => {
    try {
      const goals = JSON.parse(localStorage.getItem(`user_goals_${userId}`) || '{}');
      return { success: true, data: goals };
    } catch (error) {
      return { success: false, error: 'Failed to get user goals' };
    }
  },

  // Save filter preferences for memory
  saveFilterPreferences: async (userId, filters) => {
    try {
      const filterData = {
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`filter_preferences_${userId}`, JSON.stringify(filterData));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to save filter preferences' };
    }
  },

  // Get saved filter preferences
  getFilterPreferences: async (userId) => {
    try {
      const savedFilters = localStorage.getItem(`filter_preferences_${userId}`);
      if (savedFilters) {
        const filterData = JSON.parse(savedFilters);
        return {
          success: true,
          data: {
            ...filterData,
            startDate: filterData.startDate ? new Date(filterData.startDate) : null,
            endDate: filterData.endDate ? new Date(filterData.endDate) : null
          }
        };
      }
      return { success: true, data: null };
    } catch (error) {
      return { success: false, error: 'Failed to get filter preferences' };
    }
  }
};

export default enhancedPerformanceService;