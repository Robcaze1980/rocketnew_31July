import { supabase } from './supabase';

const managerService = {
  // Phase 1: Department KPI Cards - Real Data Implementation
  async getManagerTeamKPIs(managerId, dateRange = null) {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);

      // Get team members under this manager
      const { data: teamMembers, error: teamError } = await supabase?.from('user_profiles')?.select('id')?.eq('manager_id', managerId);

      if (teamError) throw teamError;

      const teamMemberIds = teamMembers?.map(member => member?.id) || [];

      if (teamMemberIds?.length === 0) {
        return {
          totalRevenue: 0,
          totalCommissions: 0,
          totalSales: 0,
          activeTeamMembers: 0
        };
      }

      // Get sales data for team members in date range
      let salesQuery = supabase?.from('sales')?.select('sale_price, commission_total, status')?.in('salesperson_id', teamMemberIds)?.eq('status', 'completed');

      if (startDate && endDate) {
        salesQuery = salesQuery?.gte('sale_date', startDate)?.lte('sale_date', endDate);
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      // Calculate KPIs
      const totalRevenue = salesData?.reduce((sum, sale) => sum + (parseFloat(sale?.sale_price) || 0), 0) || 0;
      const totalCommissions = salesData?.reduce((sum, sale) => sum + (parseFloat(sale?.commission_total) || 0), 0) || 0;
      const totalSales = salesData?.length || 0;
      const activeTeamMembers = teamMemberIds?.length;

      return {
        totalRevenue,
        totalCommissions,
        totalSales,
        activeTeamMembers
      };
    } catch (error) {
      console.error('Error fetching manager team KPIs:', error);
      throw error;
    }
  },

  // Phase 2: Performance Analytics - Real Data Integration
  async getTeamPerformanceData(managerId, dateRange = null) {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);

      // Get team members with their profile info
      const { data: teamMembers, error: teamError } = await supabase?.from('user_profiles')?.select('id, full_name, role')?.eq('manager_id', managerId);

      if (teamError) throw teamError;

      const teamMemberIds = teamMembers?.map(member => member?.id) || [];

      if (teamMemberIds?.length === 0) {
        return [];
      }

      // Get detailed sales performance for each team member
      let salesQuery = supabase?.from('sales')?.select(`
          salesperson_id,
          sale_price,
          commission_total,
          commission_sale,
          commission_accessories,
          commission_warranty,
          commission_service,
          spiff_bonus,
          sale_date,
          status
        `)?.in('salesperson_id', teamMemberIds)?.eq('status', 'completed');

      if (startDate && endDate) {
        salesQuery = salesQuery?.gte('sale_date', startDate)?.lte('sale_date', endDate);
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      // Aggregate performance data by team member
      const performanceData = teamMembers?.map(member => {
        const memberSales = salesData?.filter(sale => sale?.salesperson_id === member?.id) || [];

        return {
          id: member?.id,
          name: member?.full_name,
          role: member?.role,
          totalSales: memberSales?.length,
          totalRevenue: memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.sale_price) || 0), 0),
          totalCommissions: memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.commission_total) || 0), 0),
          commissionBreakdown: {
            sale: memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.commission_sale) || 0), 0),
            accessories: memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.commission_accessories) || 0), 0),
            warranty: memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.commission_warranty) || 0), 0),
            service: memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.commission_service) || 0), 0),
            spiff: memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.spiff_bonus) || 0), 0)
          },
          averageSaleValue: memberSales?.length > 0 ?
            memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.sale_price) || 0), 0) / memberSales?.length : 0
        };
      });

      return performanceData;
    } catch (error) {
      console.error('Error fetching team performance data:', error);
      throw error;
    }
  },

  // Phase 2: Monthly Trends Data
  async getMonthlyTrends(managerId, months = 6) {
    try {
      const endDate = new Date();
      let startDate = new Date();
      startDate?.setMonth(startDate?.getMonth() - months);

      // Get team members
      const { data: teamMembers, error: teamError } = await supabase?.from('user_profiles')?.select('id')?.eq('manager_id', managerId);

      if (teamError) throw teamError;

      const teamMemberIds = teamMembers?.map(member => member?.id) || [];

      if (teamMemberIds?.length === 0) {
        return [];
      }

      // Get sales data grouped by month
      const { data: salesData, error: salesError } = await supabase?.from('sales')?.select('sale_price, commission_total, sale_date, status')?.in('salesperson_id', teamMemberIds)?.eq('status', 'completed')?.gte('sale_date', startDate?.toISOString()?.split('T')?.[0])?.lte('sale_date', endDate?.toISOString()?.split('T')?.[0])?.order('sale_date', { ascending: true });

      if (salesError) throw salesError;

      // Group by month and calculate trends
      const monthlyData = {};

      salesData?.forEach(sale => {
        const monthKey = sale?.sale_date?.substring(0, 7); // YYYY-MM format

        if (!monthlyData?.[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            revenue: 0,
            commissions: 0,
            salesCount: 0
          };
        }

        monthlyData[monthKey].revenue += parseFloat(sale?.sale_price) || 0;
        monthlyData[monthKey].commissions += parseFloat(sale?.commission_total) || 0;
        monthlyData[monthKey].salesCount += 1;
      });

      return Object.values(monthlyData)?.sort((a, b) => a?.month?.localeCompare(b?.month));
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      throw error;
    }
  },

  // Phase 2: Goal Progress Data
  async getGoalProgress(managerId, dateRange = null) {
    try {
      const kpiData = await this.getManagerTeamKPIs(managerId, dateRange);

      // Example goals - in real implementation, these would come from a goals table
      const goals = {
        revenue: 150000,
        sales: 50,
        commissions: 15000
      };

      return {
        revenue: {
          current: kpiData?.totalRevenue,
          target: goals?.revenue,
          percentage: Math.min((kpiData?.totalRevenue / goals?.revenue) * 100, 100)
        },
        sales: {
          current: kpiData?.totalSales,
          target: goals?.sales,
          percentage: Math.min((kpiData?.totalSales / goals?.sales) * 100, 100)
        },
        commissions: {
          current: kpiData?.totalCommissions,
          target: goals?.commissions,
          percentage: Math.min((kpiData?.totalCommissions / goals?.commissions) * 100, 100)
        }
      };
    } catch (error) {
      console.error('Error fetching goal progress:', error);
      throw error;
    }
  },

  // Phase 3: Real-time Updates Setup
  subscribeToTeamUpdates(managerId, callback) {
    try {
      // Subscribe to sales table changes for team members
      const channel = supabase?.channel('manager_team_updates')?.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sales'
          },
          async (payload) => {
            // Verify this sale belongs to manager's team
            const { data: teamMember } = await supabase?.from('user_profiles')?.select('id')?.eq('id', payload?.new?.salesperson_id || payload?.old?.salesperson_id)?.eq('manager_id', managerId)?.single();

            if (teamMember) {
              callback(payload);
            }
          }
        )?.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_profiles',
            filter: `manager_id=eq.${managerId}`
          },
          callback
        )?.subscribe();

      return channel;
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      throw error;
    }
  },

  // Phase 3: Data Flow Verification Utilities
  async verifyManagerAccess(managerId) {
    try {
      const { data: manager, error } = await supabase?.from('user_profiles')?.select('id, role, full_name')?.eq('id', managerId)?.in('role', ['manager', 'admin'])?.single();

      if (error || !manager) {
        throw new Error('Manager access verification failed');
      }

      return manager;
    } catch (error) {
      console.error('Error verifying manager access:', error);
      throw error;
    }
  },

  async getTeamMembers(managerId, dateRange = null) {
    try {
      // Get team members
      const { data: teamMembers, error: teamError } = await supabase?.from('user_profiles')?.select('id, full_name, email, role, start_date')?.eq('manager_id', managerId)?.order('full_name');

      if (teamError) throw teamError;

      if (!teamMembers || teamMembers?.length === 0) {
        return [];
      }

      // Get sales data for team members in date range
      const teamMemberIds = teamMembers?.map(member => member?.id) || [];
      const { startDate, endDate } = this.getDateRange(dateRange);

      let salesQuery = supabase?.from('sales')?.select(`
          salesperson_id,
          sale_price,
          commission_total
        `)?.in('salesperson_id', teamMemberIds)?.eq('status', 'completed');

      if (startDate && endDate) {
        salesQuery = salesQuery?.gte('sale_date', startDate)?.lte('sale_date', endDate);
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      // Calculate performance metrics for each team member
      const teamMembersWithPerformance = teamMembers?.map(member => {
        const memberSales = salesData?.filter(sale => sale?.salesperson_id === member?.id) || [];
        
        return {
          ...member,
          total_sales: memberSales?.length || 0,
          total_revenue: memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.sale_price) || 0), 0) || 0,
          total_commission: memberSales?.reduce((sum, sale) => sum + (parseFloat(sale?.commission_total) || 0), 0) || 0
        };
      });

      // Sort by total sales (descending)
      return teamMembersWithPerformance?.sort((a, b) => (b?.total_sales || 0) - (a?.total_sales || 0)) || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  // Utility function for date range handling
  getDateRange(dateRange) {
    if (!dateRange) {
      // Default to current month
      const now = new Date();
      let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return {
        startDate: startDate?.toISOString()?.split('T')?.[0],
        endDate: endDate?.toISOString()?.split('T')?.[0]
      };
    }

    return {
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate
    };
  },

  // Enhanced method for getting team KPIs with new/used breakdown
  async getEnhancedTeamKPIs(managerId, dateRange = null) {
    try {
      // Verify manager access first
      await this.verifyManagerAccess(managerId);

      // Get team members
      const teamMembers = await this.getTeamMembers(managerId);
      const teamMemberIds = teamMembers?.map(member => member?.id) || [];
      
      if (teamMemberIds?.length === 0) {
        return {
          totalRevenue: 0,
          totalCommissions: 0,
          totalSales: 0,
          activeTeamMembers: 0,
          newCarSales: 0,
          usedCarSales: 0
        };
      }

      // Build date filter for sales query
      let salesQuery = supabase?.from('sales')?.select(`
          sale_price,
          commission_total,
          vehicle_type,
          status,
          salesperson_id
        `)?.in('salesperson_id', teamMemberIds)?.eq('status', 'completed')?.not('sale_price', 'is', null);

      // Apply date range if provided
      if (dateRange?.startDate && dateRange?.endDate) {
        salesQuery = salesQuery?.gte('sale_date', dateRange?.startDate)?.lte('sale_date', dateRange?.endDate);
      } else {
        // Default to current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)?.toISOString()?.split('T')?.[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)?.toISOString()?.split('T')?.[0];
        salesQuery = salesQuery?.gte('sale_date', startOfMonth)?.lte('sale_date', endOfMonth);
      }

      const { data: salesData, error } = await salesQuery;

      if (error) throw error;

      // Calculate enhanced KPIs
      const totalRevenue = salesData?.reduce((sum, sale) => sum + (parseFloat(sale?.sale_price) || 0), 0) || 0;
      const totalCommissions = salesData?.reduce((sum, sale) => sum + (parseFloat(sale?.commission_total) || 0), 0) || 0;
      const totalSales = salesData?.length || 0;
      const newCarSales = salesData?.filter(sale => sale?.vehicle_type === 'new')?.length || 0;
      const usedCarSales = salesData?.filter(sale => sale?.vehicle_type === 'used')?.length || 0;

      return {
        totalRevenue,
        totalCommissions,
        totalSales,
        activeTeamMembers: teamMemberIds?.length,
        newCarSales,
        usedCarSales
      };

    } catch (error) {
      console.error('Error in getEnhancedTeamKPIs:', error);
      throw error;
    }
  },

  // New method for product profitability analysis
  async getProductProfitabilityAnalysis(managerId, dateRange = null) {
    try {
      // Verify manager access first
      await this.verifyManagerAccess(managerId);

      // Get team members
      const teamMembers = await this.getTeamMembers(managerId);
      const teamMemberIds = teamMembers?.map(member => member?.id) || [];
      
      if (teamMemberIds?.length === 0) {
        return {
          warranties: { totalCost: 0, totalIncome: 0, profitMargin: 0, salesCount: 0 },
          maintenance: { totalCost: 0, totalIncome: 0, profitMargin: 0, salesCount: 0 },
          accessories: { totalCost: 0, totalIncome: 0, profitMargin: 0, salesCount: 0 }
        };
      }

      // Build sales query
      let salesQuery = supabase?.from('sales')?.select(`
          warranty_selling_price,
          warranty_cost,
          service_price,
          service_cost,
          accessories_value,
          status
        `)?.in('salesperson_id', teamMemberIds)?.eq('status', 'completed');

      // Apply date range if provided
      if (dateRange?.startDate && dateRange?.endDate) {
        salesQuery = salesQuery?.gte('sale_date', dateRange?.startDate)?.lte('sale_date', dateRange?.endDate);
      } else {
        // Default to current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)?.toISOString()?.split('T')?.[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)?.toISOString()?.split('T')?.[0];
        salesQuery = salesQuery?.gte('sale_date', startOfMonth)?.lte('sale_date', endOfMonth);
      }

      const { data: salesData, error } = await salesQuery;

      if (error) throw error;

      // Calculate profitability for each product category
      const warranties = {
        totalIncome: salesData?.reduce((sum, sale) => sum + (parseFloat(sale?.warranty_selling_price) || 0), 0) || 0,
        totalCost: salesData?.reduce((sum, sale) => sum + (parseFloat(sale?.warranty_cost) || 0), 0) || 0,
        salesCount: salesData?.filter(sale => (parseFloat(sale?.warranty_selling_price) || 0) > 0)?.length || 0
      };

      const maintenance = {
        totalIncome: salesData?.reduce((sum, sale) => sum + (parseFloat(sale?.service_price) || 0), 0) || 0,
        totalCost: salesData?.reduce((sum, sale) => sum + (parseFloat(sale?.service_cost) || 0), 0) || 0,
        salesCount: salesData?.filter(sale => (parseFloat(sale?.service_price) || 0) > 0)?.length || 0
      };

      // For accessories, we assume 70% cost ratio (since cost isn't tracked separately)
      const accessoriesIncome = salesData?.reduce((sum, sale) => sum + (parseFloat(sale?.accessories_value) || 0), 0) || 0;
      const accessories = {
        totalIncome: accessoriesIncome,
        totalCost: accessoriesIncome * 0.7,
        salesCount: salesData?.filter(sale => (parseFloat(sale?.accessories_value) || 0) > 0)?.length || 0
      };

      // Calculate profit margins
      warranties.profitMargin = warranties?.totalIncome > 0 
        ? ((warranties?.totalIncome - warranties?.totalCost) / warranties?.totalIncome) * 100 
        : 0;

      maintenance.profitMargin = maintenance?.totalIncome > 0 
        ? ((maintenance?.totalIncome - maintenance?.totalCost) / maintenance?.totalIncome) * 100 
        : 0;

      accessories.profitMargin = accessories?.totalIncome > 0 
        ? ((accessories?.totalIncome - accessories?.totalCost) / accessories?.totalIncome) * 100 
        : 0;

      return {
        warranties,
        maintenance,
        accessories
      };

    } catch (error) {
      console.error('Error in getProductProfitabilityAnalysis:', error);
      throw error;
    }
  },

  // New method for performance trends
  async getPerformanceTrends(managerId, dateRange = 'last90') {
    try {
      // Verify manager access first
      await this.verifyManagerAccess(managerId);

      // Get team members
      const teamMembers = await this.getTeamMembers(managerId);
      const teamMemberIds = teamMembers?.map(member => member?.id) || [];
      
      if (teamMemberIds?.length === 0) {
        return {
          revenueData: [],
          commissionsData: [],
          salesCountData: [],
          combinedData: []
        };
      }

      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'last30':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last180':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default: // last90
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      // Get sales data for the period
      const { data: salesData, error } = await supabase?.from('sales')?.select(`
          sale_date,
          sale_price,
          commission_total,
          status
        `)?.in('salesperson_id', teamMemberIds)?.eq('status', 'completed')?.gte('sale_date', startDate?.toISOString()?.split('T')?.[0])?.order('sale_date', { ascending: true });

      if (error) throw error;

      // Group data by date
      const dataByDate = {};
      
      salesData?.forEach(sale => {
        const date = sale?.sale_date;
        if (!dataByDate?.[date]) {
          dataByDate[date] = {
            date,
            revenue: 0,
            commissions: 0,
            salesCount: 0
          };
        }
        
        dataByDate[date].revenue += parseFloat(sale?.sale_price) || 0;
        dataByDate[date].commissions += parseFloat(sale?.commission_total) || 0;
        dataByDate[date].salesCount += 1;
      });

      // Convert to array and fill missing dates
      const combinedData = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= now) {
        const dateStr = currentDate?.toISOString()?.split('T')?.[0];
        combinedData?.push(dataByDate?.[dateStr] || {
          date: dateStr,
          revenue: 0,
          commissions: 0,
          salesCount: 0
        });
        currentDate?.setDate(currentDate?.getDate() + 1);
      }

      return {
        revenueData: combinedData?.map(item => ({ date: item?.date, value: item?.revenue })),
        commissionsData: combinedData?.map(item => ({ date: item?.date, value: item?.commissions })),
        salesCountData: combinedData?.map(item => ({ date: item?.date, value: item?.salesCount })),
        combinedData
      };

    } catch (error) {
      console.error('Error in getPerformanceTrends:', error);
      throw error;
    }
  },

  // Cleanup method for subscriptions
  unsubscribeChannel(channel) {
    if (channel) {
      supabase?.removeChannel(channel);
    }
  },

  // New method to get sales data for a specific team member
  async getTeamMemberSales(memberId) {
    try {
      if (!memberId) {
        throw new Error('Member ID is required');
      }

      // Get sales data for the specific team member
      const { data: salesData, error } = await supabase?.from('sales')?.select(`
          *,
          sales_partner:sales_partner_id(full_name),
          salesperson:salesperson_id(full_name)
        `)?.or(`salesperson_id.eq.${memberId},sales_partner_id.eq.${memberId}`)?.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team member sales:', error);
        throw error;
      }

      return salesData || [];
    } catch (error) {
      console.error('Error in getTeamMemberSales:', error);
      throw error;
    }
  },

  // New method to get team alerts (recent activities for team members)
  async getTeamAlerts(managerId, dateRange = null) {
    try {
      // Verify manager access first
      await this.verifyManagerAccess(managerId);

      // Get team members
      const teamMembers = await this.getTeamMembers(managerId);
      const teamMemberIds = teamMembers?.map(member => member?.id) || [];
      
      if (teamMemberIds?.length === 0) {
        return [];
      }

      // Build activity query
      let activityQuery = supabase?.from('activity_log')?.select(`
          *,
          user:user_id(full_name, role)
        `)?.in('user_id', teamMemberIds)?.order('created_at', { ascending: false })?.limit(10);

      // Apply date range if provided
      if (dateRange?.startDate && dateRange?.endDate) {
        activityQuery = activityQuery?.gte('created_at', dateRange?.startDate)?.lte('created_at', dateRange?.endDate);
      } else {
        // Default to last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        activityQuery = activityQuery?.gte('created_at', thirtyDaysAgo?.toISOString());
      }

      const { data: activities, error } = await activityQuery;

      if (error) throw error;

      // Transform activities into alerts format
      const alerts = activities?.map(activity => {
        // Determine alert type based on action
        let type = 'info';
        if (activity?.action?.includes('Sale Created') || activity?.action?.includes('Completed')) {
          type = 'milestone';
        } else if (activity?.action?.includes('Updated') || activity?.action?.includes('Modified')) {
          type = 'attention';
        } else if (activity?.action?.includes('Goal') || activity?.action?.includes('Target')) {
          type = 'achievement';
        }

        return {
          id: activity?.id,
          type,
          message: `${activity?.user?.full_name || 'Unknown'} ${activity?.action?.toLowerCase()}`,
          time: this.formatTimeAgo(activity?.created_at),
          timestamp: activity?.created_at
        };
      }) || [];

      return alerts;
    } catch (error) {
      console.error('Error in getTeamAlerts:', error);
      throw error;
    }
  },

  // New method to get recent team activities
  async getRecentTeamActivities(managerId, dateRange = null) {
    try {
      // Verify manager access first
      await this.verifyManagerAccess(managerId);

      // Get team members
      const teamMembers = await this.getTeamMembers(managerId);
      const teamMemberIds = teamMembers?.map(member => member?.id) || [];
      
      if (teamMemberIds?.length === 0) {
        return [];
      }

      // Build sales query to get recent activities
      let salesQuery = supabase?.from('sales')?.select(`
          *,
          salesperson:salesperson_id(full_name),
          sales_partner:sales_partner_id(full_name)
        `)?.in('salesperson_id', teamMemberIds)?.order('created_at', { ascending: false })?.limit(10);

      // Apply date range if provided
      if (dateRange?.startDate && dateRange?.endDate) {
        salesQuery = salesQuery?.gte('created_at', dateRange?.startDate)?.lte('created_at', dateRange?.endDate);
      } else {
        // Default to last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        salesQuery = salesQuery?.gte('created_at', thirtyDaysAgo?.toISOString());
      }

      const { data: sales, error } = await salesQuery;

      if (error) throw error;

      // Transform sales into activities format
      const activities = sales?.map(sale => {
        const isShared = sale?.is_shared_sale;
        const salespersonName = isShared 
          ? `${sale?.salesperson?.full_name || 'Unknown'} & ${sale?.sales_partner?.full_name || 'Partner'}`
          : sale?.salesperson?.full_name || 'Unknown';

        return {
          id: sale?.id,
          salesperson: salespersonName,
          action: isShared ? 'Completed shared sale' : 'Completed sale',
          amount: `$${parseFloat(sale?.sale_price || 0)?.toLocaleString()}`,
          time: this.formatTimeAgo(sale?.created_at),
          timestamp: sale?.created_at
        };
      }) || [];

      return activities;
    } catch (error) {
      console.error('Error in getRecentTeamActivities:', error);
      throw error;
    }
  },

  // Utility function to format time ago
  formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now - then) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
};

export default managerService;
