import { supabase } from './supabase';

class AnalyticsService {
  // Team Comparison Analytics
  async getTeamPerformanceComparison(managerId, startDate = null, endDate = null) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .rpc('get_team_performance_comparison', {
          manager_user_id: managerId,
          start_date: start,
          end_date: end
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get team performance benchmarks
  async getTeamBenchmarks(managerId) {
    try {
      const { data: teamData, error: teamError } = await this.getTeamPerformanceComparison(managerId);
      
      if (teamError || !teamData.success) {
        throw new Error(teamData?.error || 'Failed to get team data');
      }

      const team = teamData.data;
      if (!team?.length) {
        return {
          success: true,
          data: {
            topPerformer: null,
            teamAverage: { sales: 0, revenue: 0, commission: 0 },
            benchmarks: { sales: 0, revenue: 0, commission: 0 }
          }
        };
      }

      const teamAverage = {
        sales: Math.round(team.reduce((sum, member) => sum + (member.total_sales || 0), 0) / team.length),
        revenue: Math.round(team.reduce((sum, member) => sum + (member.total_revenue || 0), 0) / team.length),
        commission: Math.round(team.reduce((sum, member) => sum + (member.total_commission || 0), 0) / team.length)
      };

      const topPerformer = team.reduce((top, member) => 
        (member.total_revenue || 0) > (top?.total_revenue || 0) ? member : top, null);

      const benchmarks = {
        sales: Math.max(...team.map(m => m.total_sales || 0)),
        revenue: Math.max(...team.map(m => m.total_revenue || 0)),
        commission: Math.max(...team.map(m => m.total_commission || 0))
      };

      return {
        success: true,
        data: {
          topPerformer,
          teamAverage,
          benchmarks
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Goal Tracking Functions
  async getGoalProgress(teamMemberId, targetPeriod = 'monthly') {
    try {
      const { data, error } = await supabase
        .rpc('get_goal_progress', {
          team_member_uuid: teamMemberId,
          target_period_param: targetPeriod
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data?.[0] || null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Get all team targets for a manager
  async getTeamTargets(managerId, period = 'monthly') {
    try {
      const { data, error } = await supabase
        .from('team_targets')
        .select(`
          *,
          team_member:user_profiles!team_targets_team_member_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('manager_id', managerId)
        .eq('target_period', period)
        .gte('period_end', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Create or update team target
  async setTeamTarget(targetData) {
    try {
      const { data, error } = await supabase
        .from('team_targets')
        .upsert({
          team_member_id: targetData.teamMemberId,
          manager_id: targetData.managerId,
          target_period: targetData.period,
          period_start: targetData.startDate,
          period_end: targetData.endDate,
          sales_target: targetData.salesTarget,
          revenue_target: targetData.revenueTarget,
          commission_target: targetData.commissionTarget
        }, {
          onConflict: 'team_member_id,manager_id,target_period,period_start'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Forecasting Functions
  async getSalesForecast(teamMemberId, forecastDays = 30) {
    try {
      const { data, error } = await supabase
        .rpc('get_sales_forecast', {
          team_member_uuid: teamMemberId,
          forecast_days: forecastDays
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data?.[0] || null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Get performance trends for forecasting
  async getPerformanceTrends(teamMemberId, days = 90) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('user_id', teamMemberId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Department Goals Management
  async getDepartmentGoals(managerId, period = 'monthly') {
    try {
      const { data, error } = await supabase
        .from('department_goals')
        .select('*')
        .eq('manager_id', managerId)
        .eq('goal_period', period)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Create department goal
  async createDepartmentGoal(goalData) {
    try {
      const { data, error } = await supabase
        .from('department_goals')
        .insert({
          department_name: goalData.departmentName,
          manager_id: goalData.managerId,
          goal_period: goalData.period,
          period_start: goalData.startDate,
          period_end: goalData.endDate,
          total_sales_goal: goalData.salesGoal,
          total_revenue_goal: goalData.revenueGoal,
          team_size: goalData.teamSize,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Real-time conversion rates and metrics calculation
  async getConversionMetrics(teamMemberId, startDate, endDate) {
    try {
      // Get sales data for conversion calculation
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('salesperson_id', teamMemberId)
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);

      if (salesError) {
        throw salesError;
      }

      // Get activity data for leads/prospects
      const { data: activityData, error: activityError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', teamMemberId)
        .gte('created_at', `${startDate}T00:00:00Z`)
        .lte('created_at', `${endDate}T23:59:59Z`);

      if (activityError) {
        throw activityError;
      }

      const completedSales = salesData?.filter(sale => sale.status === 'completed') || [];
      const totalInteractions = activityData?.length || 0;
      
      const conversionRate = totalInteractions > 0 
        ? ((completedSales.length / totalInteractions) * 100).toFixed(2)
        : 0;

      const avgSaleValue = completedSales.length > 0
        ? (completedSales.reduce((sum, sale) => sum + (sale.sale_price || 0), 0) / completedSales.length).toFixed(2)
        : 0;

      return {
        success: true,
        data: {
          totalSales: completedSales.length,
          totalInteractions,
          conversionRate: parseFloat(conversionRate),
          avgSaleValue: parseFloat(avgSaleValue),
          salesData: completedSales
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Update performance metrics (called daily)
  async updateDailyMetrics() {
    try {
      const { data, error } = await supabase
        .rpc('update_daily_performance_metrics');

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Daily metrics updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new AnalyticsService();