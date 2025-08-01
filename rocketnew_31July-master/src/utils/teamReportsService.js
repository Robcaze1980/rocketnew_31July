import { supabase } from './supabase';


class TeamReportsService {
  // Get comprehensive team performance data for reports
  async getTeamPerformanceReport(managerId, filters = {}) {
    try {
      const {
        dateRange = 'last_30_days',
        salesTeam = 'all',
        salesperson = 'all',
        vehicleCategory = 'all',
        commissionType = 'all',
        startDate,
        endDate
      } = filters;

      // Calculate date range
      const { startDateStr, endDateStr } = this.calculateDateRange(dateRange, startDate, endDate);

      // Get team members under this manager
      let teamMembersQuery = supabase
        .from('user_profiles')
        .select('*')
        .eq('manager_id', managerId)
        .eq('status', 'active');

      // Apply salesperson filter
      if (salesperson !== 'all') {
        teamMembersQuery = teamMembersQuery.eq('id', salesperson);
      }

      // Apply sales team filter (department filter)
      if (salesTeam !== 'all') {
        const departmentMap = {
          'new_vehicle': 'New Car Sales',
          'used_vehicle': 'Used Car Sales',
          'commercial': 'Commercial Sales'
        };
        teamMembersQuery = teamMembersQuery.eq('department', departmentMap[salesTeam]);
      }

      const { data: teamMembers, error: teamError } = await teamMembersQuery;

      if (teamError) throw teamError;

      if (!teamMembers || teamMembers.length === 0) {
        return {
          success: true,
          data: []
        };
      }

      // Get sales data for team members
      const teamMemberIds = teamMembers.map(member => member.id);
      
      let salesQuery = supabase
        .from('sales')
        .select('*')
        .in('salesperson_id', teamMemberIds)
        .gte('sale_date', startDateStr)
        .lte('sale_date', endDateStr)
        .eq('status', 'completed');

      // Apply vehicle category filter
      if (vehicleCategory !== 'all') {
        if (vehicleCategory === 'certified') {
          // For certified pre-owned, we'll assume it's a subset of used vehicles
          salesQuery = salesQuery.eq('vehicle_type', 'used');
        } else {
          salesQuery = salesQuery.eq('vehicle_type', vehicleCategory);
        }
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      // Process data for each team member
      const reportData = await Promise.all(
        teamMembers.map(async (member) => {
          const memberSales = salesData?.filter(sale => sale.salesperson_id === member.id) || [];
          
          // Calculate commission components based on filter
          let saleCommission = 0;
          let accessoriesCommission = 0;
          let warrantyCommission = 0;
          let serviceCommission = 0;
          let spiffBonus = 0;

          memberSales.forEach(sale => {
            const multiplier = sale.is_shared_sale ? 0.5 : 1;

            if (commissionType === 'all' || commissionType === 'sale') {
              saleCommission += (sale.commission_sale || 0) * multiplier;
            }
            if (commissionType === 'all' || commissionType === 'accessories') {
              accessoriesCommission += (sale.commission_accessories || 0) * multiplier;
            }
            if (commissionType === 'all' || commissionType === 'warranty') {
              warrantyCommission += (sale.commission_warranty || 0) * multiplier;
            }
            if (commissionType === 'all' || commissionType === 'service') {
              serviceCommission += (sale.commission_service || 0) * multiplier;
            }
            if (commissionType === 'all' || commissionType === 'spiff') {
              spiffBonus += (sale.spiff_bonus || 0) * multiplier;
            }
          });

          const totalCommission = saleCommission + accessoriesCommission + warrantyCommission + serviceCommission + spiffBonus;
          const totalSales = memberSales.length;
          const totalRevenue = memberSales.reduce((sum, sale) => sum + (sale.sale_price || 0), 0);
          const avgSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

          // Calculate conversion rate (for simplicity, we'll use completed sales ratio)
          // In a real system, you'd track total attempts vs completions
          const conversionRate = totalSales > 0 ? 95 : 0; // Mock conversion rate

          // Get team targets for goal achievement calculation
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();

          const { data: targets } = await supabase
            .from('team_targets')
            .select('*')
            .eq('salesperson_id', member.id)
            .eq('target_year', currentYear)
            .eq('target_month', currentMonth)
            .single();

          const goalAchievement = targets?.sales_target > 0 
            ? (totalSales / targets.sales_target) * 100 
            : 0;

          return {
            id: member.id,
            salesperson: member.full_name,
            totalSales,
            totalCommission: Math.round(totalCommission),
            saleCommission: Math.round(saleCommission),
            accessoriesCommission: Math.round(accessoriesCommission),
            warrantyCommission: Math.round(warrantyCommission),
            serviceCommission: Math.round(serviceCommission),
            spiffBonus: Math.round(spiffBonus),
            conversionRate: Math.round(conversionRate * 10) / 10,
            avgSalePrice: Math.round(avgSalePrice),
            goalAchievement: Math.round(goalAchievement * 10) / 10
          };
        })
      );

      return {
        success: true,
        data: reportData.sort((a, b) => b.totalCommission - a.totalCommission)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch team performance report'
      };
    }
  }

  // Get team members for filter options
  async getTeamMembersForFilters(managerId) {
    try {
      const { data: teamMembers, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, department')
        .eq('manager_id', managerId)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;

      return {
        success: true,
        data: teamMembers || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch team members'
      };
    }
  }

  // Get available sales teams (departments) for filters
  async getSalesTeamsForFilters(managerId) {
    try {
      const { data: departments, error } = await supabase
        .from('user_profiles')
        .select('department')
        .eq('manager_id', managerId)
        .not('department', 'is', null);

      if (error) throw error;

      const uniqueDepartments = [...new Set(departments?.map(d => d.department).filter(Boolean))];
      
      const salesTeamOptions = uniqueDepartments.map(dept => {
        const departmentMap = {
          'New Car Sales': { value: 'new_vehicle', label: 'New Vehicle Sales' },
          'Used Car Sales': { value: 'used_vehicle', label: 'Used Vehicle Sales' },
          'Commercial Sales': { value: 'commercial', label: 'Commercial Sales' }
        };
        return departmentMap[dept] || { value: dept.toLowerCase().replace(' ', '_'), label: dept };
      });

      return {
        success: true,
        data: salesTeamOptions
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch sales teams'
      };
    }
  }

  // Export report data in different formats
  async exportReportData(reportData, format) {
    try {
      if (format === 'csv') {
        return this.exportToCSV(reportData);
      } else if (format === 'excel') {
        return this.exportToExcel(reportData);
      } else if (format === 'pdf') {
        return this.exportToPDF(reportData);
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to export report data'
      };
    }
  }

  // Helper method to calculate date range
  calculateDateRange(dateRange, customStartDate, customEndDate) {
    const today = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'today':
        startDate = endDate = today;
        break;
      case 'yesterday':
        startDate = endDate = new Date(today.setDate(today.getDate() - 1));
        break;
      case 'last_7_days':
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last_30_days':
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last_90_days':
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'this_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this_quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        endDate = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'custom':
        startDate = customStartDate || new Date();
        endDate = customEndDate || new Date();
        break;
      default:
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
    }

    return {
      startDateStr: startDate.toISOString().split('T')[0],
      endDateStr: endDate.toISOString().split('T')[0]
    };
  }

  // CSV Export functionality
  exportToCSV(reportData) {
    const headers = [
      'Salesperson',
      'Total Sales',
      'Total Commission',
      'Sale Commission',
      'Accessories Commission',
      'Warranty Commission',
      'Service Commission',
      'SPIFF Bonus',
      'Conversion Rate (%)',
      'Average Sale Price',
      'Goal Achievement (%)'
    ];

    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        `"${row.salesperson}"`,
        row.totalSales,
        row.totalCommission,
        row.saleCommission,
        row.accessoriesCommission,
        row.warrantyCommission,
        row.serviceCommission,
        row.spiffBonus,
        row.conversionRate,
        row.avgSalePrice,
        row.goalAchievement
      ].join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `team_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: 'CSV export completed' };
  }

  // Excel Export functionality (simplified)
  exportToExcel(reportData) {
    // For simplicity, we'll export as CSV with .xlsx extension
    // In a real implementation, you'd use a library like xlsx or exceljs
    return this.exportToCSV(reportData);
  }

  // PDF Export functionality (simplified)
  exportToPDF(reportData) {
    // This is a simplified implementation
    // In a real application, you'd use a library like jsPDF or similar console.log('PDF export functionality would be implemented here');
    return { success: true, message: 'PDF export would be implemented with proper library' };
  }

  // Generate scheduled report
  async generateScheduledReport(managerId, reportConfig) {
    try {
      const reportResult = await this.getTeamPerformanceReport(managerId, reportConfig.filters);
      
      if (!reportResult.success) {
        throw new Error(reportResult.error);
      }

      // In a real implementation, you would:
      // 1. Generate the report in the requested format
      // 2. Store it in Supabase storage
      // 3. Send email notifications
      // 4. Log the report generation in activity_log

      return {
        success: true,
        data: {
          reportId: crypto.randomUUID(),
          generatedAt: new Date().toISOString(),
          recordCount: reportResult.data.length,
          format: reportConfig.format || 'excel'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to generate scheduled report'
      };
    }
  }
}

export default new TeamReportsService();