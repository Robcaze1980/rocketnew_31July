import { supabase } from './supabase';

const performanceService = {
  // Get comprehensive performance data for a user
  getUserPerformanceData: async (userId) => {
    try {
      // Get current date ranges
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      // Current month range
      const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      
      // Year to date range
      const yearStart = new Date(currentYear, 0, 1).toISOString().split('T')[0];
      
      // Previous month for comparison
      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
      const prevMonthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

      // Fetch current month sales
      const { data: currentMonthSales, error: currentError } = await supabase
        .from('sales')
        .select('*')
        .or(`salesperson_id.eq.${userId},sales_partner_id.eq.${userId}`)
        .eq('status', 'completed')
        .gte('sale_date', monthStart)
        .lte('sale_date', monthEnd);

      if (currentError) {
        return { success: false, error: currentError.message };
      }

      // Fetch previous month sales for comparison
      const { data: prevMonthSales, error: prevError } = await supabase
        .from('sales')
        .select('*')
        .or(`salesperson_id.eq.${userId},sales_partner_id.eq.${userId}`)
        .eq('status', 'completed')
        .gte('sale_date', prevMonthStart)
        .lte('sale_date', prevMonthEnd);

      if (prevError) {
        return { success: false, error: prevError.message };
      }

      // Fetch year to date sales
      const { data: ytdSales, error: ytdError } = await supabase
        .from('sales')
        .select('*')
        .or(`salesperson_id.eq.${userId},sales_partner_id.eq.${userId}`)
        .eq('status', 'completed')
        .gte('sale_date', yearStart);

      if (ytdError) {
        return { success: false, error: ytdError.message };
      }

      // Fetch team ranking data (all users' performance this month)
      const { data: teamData, error: teamError } = await supabase
        .rpc('get_team_performance', { 
          start_date: monthStart, 
          end_date: monthEnd 
        });

      // If RPC doesn't exist, calculate manually
      let teamRanking = null;
      let totalTeamMembers = 0;
      
      if (teamError) {
        // Fallback: get all users and their sales counts
        const { data: allUsers, error: usersError } = await supabase
          .from('user_profiles')
          .select('id, full_name');

        if (!usersError && allUsers) {
          totalTeamMembers = allUsers.length;
          
          // Calculate each user's commission for ranking
          const userCommissions = await Promise.all(
            allUsers.map(async (user) => {
              const { data: userSales } = await supabase
                .from('sales')
                .select('commission_total')
                .or(`salesperson_id.eq.${user.id},sales_partner_id.eq.${user.id}`)
                .eq('status', 'completed')
                .gte('sale_date', monthStart)
                .lte('sale_date', monthEnd);

              const totalCommission = userSales?.reduce((sum, sale) => 
                sum + parseFloat(sale.commission_total || 0), 0) || 0;

              return { userId: user.id, commission: totalCommission };
            })
          );

          // Sort by commission descending
          userCommissions.sort((a, b) => b.commission - a.commission);
          
          // Find current user's ranking
          const userRankIndex = userCommissions.findIndex(u => u.userId === userId);
          teamRanking = userRankIndex >= 0 ? userRankIndex + 1 : null;
        }
      } else {
        // Use RPC result if available
        const userTeamData = teamData?.find(t => t.user_id === userId);
        teamRanking = userTeamData?.ranking || null;
        totalTeamMembers = teamData?.length || 0;
      }

      // Calculate metrics
      const currentMonthCommission = currentMonthSales?.reduce((sum, sale) => {
        const commission = parseFloat(sale.commission_total || 0);
        // If shared sale, split commission
        return sum + (sale.is_shared_sale ? commission / 2 : commission);
      }, 0) || 0;

      const prevMonthCommission = prevMonthSales?.reduce((sum, sale) => {
        const commission = parseFloat(sale.commission_total || 0);
        return sum + (sale.is_shared_sale ? commission / 2 : commission);
      }, 0) || 0;

      const currentMonthSalesCount = currentMonthSales?.length || 0;
      const prevMonthSalesCount = prevMonthSales?.length || 0;

      const ytdCommission = ytdSales?.reduce((sum, sale) => {
        const commission = parseFloat(sale.commission_total || 0);
        return sum + (sale.is_shared_sale ? commission / 2 : commission);
      }, 0) || 0;

      const averageSaleValue = currentMonthSales?.length > 0 
        ? currentMonthSales.reduce((sum, sale) => sum + parseFloat(sale.sale_price || 0), 0) / currentMonthSales.length
        : 0;

      // Calculate trends
      const commissionTrend = prevMonthCommission > 0 
        ? ((currentMonthCommission - prevMonthCommission) / prevMonthCommission) * 100 
        : currentMonthCommission > 0 ? 100 : 0;

      const salesTrend = prevMonthSalesCount > 0 
        ? ((currentMonthSalesCount - prevMonthSalesCount) / prevMonthSalesCount) * 100 
        : currentMonthSalesCount > 0 ? 100 : 0;

      // Calculate conversion rate (mock for now - would need leads data)
      const conversionRate = currentMonthSalesCount > 0 ? 
        Math.min(95, 45 + (currentMonthSalesCount * 2)) : 0;

      const conversionTrend = Math.random() * 10 - 5; // Mock trend

      return {
        success: true,
        data: {
          monthlyCommission: currentMonthCommission,
          monthlyCommissionTrend: commissionTrend,
          totalSales: currentMonthSalesCount,
          totalSalesTrend: salesTrend,
          teamRanking: teamRanking,
          totalTeamMembers: totalTeamMembers,
          conversionRate: conversionRate,
          conversionTrend: conversionTrend,
          ytdCommission: ytdCommission,
          averageSaleValue: averageSaleValue,
          customerSatisfaction: 4.7 + (Math.random() * 0.3) // Mock satisfaction
        }
      };

    } catch (error) {
      return { success: false, error: 'Failed to fetch performance data' };
    }
  },

  // Get 6-month trend data
  getSixMonthTrend: async (userId) => {
    try {
      const currentDate = new Date();
      const monthsData = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data: monthSales, error } = await supabase
          .from('sales')
          .select('commission_total, is_shared_sale')
          .or(`salesperson_id.eq.${userId},sales_partner_id.eq.${userId}`)
          .eq('status', 'completed')
          .gte('sale_date', monthStart)
          .lte('sale_date', monthEnd);

        if (error) {
          return { success: false, error: error.message };
        }

        const monthCommission = monthSales?.reduce((sum, sale) => {
          const commission = parseFloat(sale.commission_total || 0);
          return sum + (sale.is_shared_sale ? commission / 2 : commission);
        }, 0) || 0;

        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });

        monthsData.push({
          month: monthName,
          commission: Math.round(monthCommission),
          sales: monthSales?.length || 0
        });
      }

      return { success: true, data: monthsData };
    } catch (error) {
      return { success: false, error: 'Failed to fetch trend data' };
    }
  },

  // Get user achievements based on performance
  getUserAchievements: async (userId) => {
    try {
      const performanceResult = await performanceService.getUserPerformanceData(userId);
      
      if (!performanceResult.success) {
        return { success: false, error: performanceResult.error };
      }

      const { data: performanceData } = performanceResult;
      const achievements = [];

      // Team ranking achievement
      if (performanceData.teamRanking && performanceData.teamRanking <= 3) {
        achievements.push({
          id: 1,
          title: 'Top Performer',
          description: `Ranked #${performanceData.teamRanking} this month`,
          icon: 'Trophy',
          color: 'text-warning'
        });
      }

      // Customer satisfaction achievement
      if (performanceData.customerSatisfaction >= 4.5) {
        achievements.push({
          id: 2,
          title: 'Customer Favorite',
          description: `${performanceData.customerSatisfaction.toFixed(1)}/5 satisfaction rating`,
          icon: 'Star',
          color: 'text-success'
        });
      }

      // Sales target achievement (assuming 10 sales is the monthly target)
      const targetPercentage = (performanceData.totalSales / 10) * 100;
      if (targetPercentage >= 100) {
        achievements.push({
          id: 3,
          title: 'Sales Target Met',
          description: `${Math.round(targetPercentage)}% of monthly goal`,
          icon: 'Target',
          color: 'text-primary'
        });
      }

      // High commission achievement
      if (performanceData.monthlyCommission >= 5000) {
        achievements.push({
          id: 4,
          title: 'High Earner',
          description: `$${performanceData.monthlyCommission.toLocaleString()} this month`,
          icon: 'DollarSign',
          color: 'text-success'
        });
      }

      return { success: true, data: achievements };
    } catch (error) {
      return { success: false, error: 'Failed to fetch achievements' };
    }
  }
};

export default performanceService;