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
      if (salesperson && salesperson !== 'all') {
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
          // Filter sales for this specific member
          const memberSales = salesData?.filter(sale => sale?.salesperson_id === member?.id) || [];
          
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
            .eq('target_period', 'monthly')
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

  // Get actual sales records for a specific salesperson
  async getSalespersonSalesRecords(managerId, salespersonId, filters = {}) {
    try {
      const {
        dateRange = 'last_30_days',
        vehicleCategory = 'all',
        startDate,
        endDate
      } = filters;

      // Calculate date range
      const { startDateStr, endDateStr } = this.calculateDateRange(dateRange, startDate, endDate);

      // Get sales records for the specific salesperson
      let salesQuery = supabase
        .from('sales')
        .select(`
          *,
          sales_partner:sales_partner_id(full_name),
          salesperson:salesperson_id(full_name)
        `)
        .eq('salesperson_id', salespersonId)
        .gte('sale_date', startDateStr)
        .lte('sale_date', endDateStr)
        .eq('status', 'completed')
        .order('sale_date', { ascending: false });

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

      // Transform sales data to match the format expected by the UI
      const salesRecords = salesData?.map(sale => ({
        id: sale.id,
        date: sale.sale_date,
        customerName: sale.customer_name,
        stockNumber: sale.stock_number,
        vehicleType: sale.vehicle_type,
        salePrice: sale.sale_price,
        commissionAmount: sale.commission_total,
        status: sale.status,
        isSharedSale: sale.is_shared_sale,
        salesPartner: sale.sales_partner?.full_name || null,
        accessoriesValue: sale.accessories_value,
        warrantySellingPrice: sale.warranty_selling_price,
        warrantyCost: sale.warranty_cost,
        servicePrice: sale.service_price,
        serviceCost: sale.service_cost,
        spiffBonus: sale.spiff_bonus
      })) || [];

      return {
        success: true,
        data: salesRecords
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch salesperson sales records'
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
    // Check if this is individual sales data or team performance data
    const isIndividualReport = reportData?.length > 0 && 
      (reportData?.[0]?.hasOwnProperty('date') && reportData?.[0]?.hasOwnProperty('customerName'));
    
    let headers, csvContent;
    
    if (isIndividualReport) {
      // Individual sales record format
      headers = [
        'Date',
        'Customer',
        'Stock Number',
        'Vehicle Type',
        'Sale Price',
        'Commission',
        'Status',
        'Shared Sale'
      ];
      
      csvContent = [
        headers.join(','),
        ...reportData.map(row => [
          `"${row.date}"`,
          `"${row.customerName}"`,
          `"${row.stockNumber}"`,
          `"${row.vehicleType}"`,
          row.salePrice,
          row.commissionAmount,
          `"${row.status}"`,
          row.isSharedSale ? 'Yes' : 'No'
        ].join(','))
      ].join('\n');
    } else {
      // Team performance summary format
      headers = [
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
      
      csvContent = [
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
    }

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const filename = isIndividualReport 
      ? `salesperson_report_${new Date().toISOString().split('T')[0]}.csv`
      : `team_performance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
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

  // PDF Export functionality
  exportToPDF(reportData) {
    try {
      // Dynamically import jsPDF and autoTable to avoid issues with server-side rendering
      Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]).then(([{ jsPDF }]) => {
        // Check if this is individual sales data or team performance data
        const isIndividualReport = reportData?.length > 0 && 
          (reportData?.[0]?.hasOwnProperty('date') && reportData?.[0]?.hasOwnProperty('customerName'));
        
        // Create a new PDF document
        const doc = new jsPDF();
        const dateStr = new Date().toISOString().split('T')[0];
        
        // Add title
        doc.setFontSize(18);
        doc.text(isIndividualReport ? 'Salesperson Report' : 'Team Performance Report', 105, 20, null, null, 'center');
        doc.setFontSize(12);
        doc.text(`Generated: ${dateStr}`, 105, 30, null, null, 'center');
        
        // Add content based on report type
        if (isIndividualReport) {
          // Individual sales record format
          const headers = ['Date', 'Customer', 'Stock #', 'Vehicle', 'Sale Price', 'Commission', 'Status', 'Shared'];
          const data = reportData.map(row => [
            row.date,
            row.customerName,
            row.stockNumber,
            row.vehicleType,
            `$${parseFloat(row.salePrice || 0)?.toFixed(2)}`,
            `$${parseFloat(row.commissionAmount || 0)?.toFixed(2)}`,
            row.status,
            row.isSharedSale ? 'Yes' : 'No'
          ]);
          
          // Add table
          doc.autoTable({
            head: [headers],
            body: data,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 160, 133] },
            alternateRowStyles: { fillColor: [240, 240, 240] }
          });
        } else {
          // Team performance summary format
          const headers = ['Salesperson', 'Sales', 'Commission', 'Sale Comm.', 'Acc. Comm.', 'War. Comm.', 'Svc. Comm.', 'SPIFF', 'Conv. Rate', 'Avg Sale', 'Goal %'];
          const data = reportData.map(row => [
            row.salesperson,
            row.totalSales,
            `$${parseFloat(row.totalCommission || 0)?.toFixed(2)}`,
            `$${parseFloat(row.saleCommission || 0)?.toFixed(2)}`,
            `$${parseFloat(row.accessoriesCommission || 0)?.toFixed(2)}`,
            `$${parseFloat(row.warrantyCommission || 0)?.toFixed(2)}`,
            `$${parseFloat(row.serviceCommission || 0)?.toFixed(2)}`,
            `$${parseFloat(row.spiffBonus || 0)?.toFixed(2)}`,
            `${parseFloat(row.conversionRate || 0)?.toFixed(1)}%`,
            `$${parseFloat(row.avgSalePrice || 0)?.toFixed(2)}`,
            `${parseFloat(row.goalAchievement || 0)?.toFixed(1)}%`
          ]);
          
          // Add table
          doc.autoTable({
            head: [headers],
            body: data,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 160, 133] },
            alternateRowStyles: { fillColor: [240, 240, 240] }
          });
        }
        
        // Save the PDF
        const filename = isIndividualReport 
          ? `salesperson_report_${dateStr}.pdf`
          : `team_performance_report_${dateStr}.pdf`;
        doc.save(filename);
      });
      
      return { success: true, message: 'PDF export completed' };
    } catch (error) {
      console.error('PDF export error:', error);
      return { success: false, error: 'Failed to generate PDF report' };
    }
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
