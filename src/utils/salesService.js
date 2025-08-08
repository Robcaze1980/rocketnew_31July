import { supabase } from './supabase';

const salesService = {
  // Commissions-driven listing for grid (per-user attribution)
  // Members: pass userId to restrict to own entries. Managers/admins: pass null to fetch all.
  getUserCommissionEntries: async (userId = null, limit = null, startDate = null, endDate = null) => {
    try {
      let query = supabase
        ?.from('commissions')
        ?.select(`
          id,
          sale_id,
          user_id,
          role,
          amount,
          created_at,
          sale:sale_id (
            id,
            stock_number,
            customer_name,
            sale_date,
            vehicle_type,
            status,
            is_shared_sale,
            salesperson_id,
            sales_partner_id
          ),
          user:user_id ( full_name )
        `)
        ?.order('created_at', { ascending: false });

      if (userId) {
        query = query?.eq('user_id', userId);
      }
      if (startDate) {
        query = query?.gte('sale.sale_date', startDate);
      }
      if (endDate) {
        query = query?.lte('sale.sale_date', endDate);
      }
      if (limit && typeof limit === 'number' && limit > 0) {
        query = query?.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error?.message, data: [] };
      }

      const rows = Array.isArray(data) ? data.filter(r => r && typeof r === 'object') : [];

      // Shape a stable structure for UI consumption
      const shaped = rows.map((r) => ({
        commission_id: r?.id,
        sale_id: r?.sale_id,
        user_id: r?.user_id,
        user_name: r?.user?.full_name || null,
        role: r?.role,
        amount: parseFloat(r?.amount || 0),
        created_at: r?.created_at,
        stock_number: r?.sale?.stock_number || null,
        customer_name: r?.sale?.customer_name || null,
        sale_date: r?.sale?.sale_date || null,
        vehicle_type: r?.sale?.vehicle_type || null,
        status: r?.sale?.status || null,
        is_shared_sale: !!r?.sale?.is_shared_sale,
        salesperson_id: r?.sale?.salesperson_id || null,
        sales_partner_id: r?.sale?.sales_partner_id || null
      }));

      return { success: true, data: shaped };
    } catch (e) {
      return { success: false, error: 'Failed to fetch commission entries', data: [] };
    }
  },

  // Recent per-user commissions for dashboard "Recent Sales" (now uses denormalized commission fields)
  getRecentUserCommissions: async (userId, limit = 10, startDate = null, endDate = null) => {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required', data: [] };
      }
      const safeLimit = (typeof limit === 'number' && limit > 0) ? limit : 10;

      // Query commissions directly using denormalized sale fields and join profiles for names
      let query = supabase
        ?.from('commissions')
        ?.select(`
          id,
          sale_id,
          user_id,
          role,
          amount,
          created_at,
          sale_date,
          stock_number,
          customer_name,
          status,
          vehicle_type,
          salesperson_id,
          sales_partner_id,
          primary:user_profiles!commissions_salesperson_id_fkey(full_name),
          partner:user_profiles!commissions_sales_partner_id_fkey(full_name)
        `)
        ?.eq('user_id', userId);

      // Align with dashboard TimeFilter using commissions.sale_date
      if (startDate) {
        query = query?.gte('sale_date', startDate);
      }
      if (endDate) {
        query = query?.lte('sale_date', endDate);
      }

      // Sort by sale_date desc to match "most recent sale first"
      query = query?.order('sale_date', { ascending: false })?.limit(safeLimit);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error?.message, data: [] };
      }

      const rows = Array.isArray(data) ? data.filter(r => r && typeof r === 'object') : [];

      const shaped = rows.map((r) => {
        // user_profiles joins may return arrays in PostgREST when using !fk syntax
        const primaryRel = Array.isArray(r?.primary) ? r.primary[0] : r?.primary;
        const partnerRel = Array.isArray(r?.partner) ? r.partner[0] : r?.partner;

        const primaryName = primaryRel?.full_name || null;
        const partnerName = partnerRel?.full_name || null;

        // Counterpart name: if this row's role is partner, counterpart is primary; else counterpart is partner
        const counterpartName = r?.role === 'partner' ? primaryName : partnerName;

        return {
          commission_id: r?.id,
          sale_id: r?.sale_id || null,
          stock_number: r?.stock_number || null,
          customer_name: r?.customer_name || null,
          sale_date: r?.sale_date || null,
          status: r?.status || null,
          is_shared_sale: !!(r?.sales_partner_id),
          salesperson_id: r?.salesperson_id || null,
          sales_partner_id: r?.sales_partner_id || null,
          role: r?.role || null,
          primary_name: primaryName,
          partner_name: partnerName,
          counterpart_name: counterpartName,
          amount: parseFloat(r?.amount || 0),
          created_at: r?.created_at
        };
      });

      return { success: true, data: shaped };
    } catch (e) {
      return { success: false, error: 'Failed to fetch recent user commissions', data: [] };
    }
  },

  // Create commission records for a sale (one row if not shared, two rows 50/50 if shared)
  createCommissionRecords: async (saleId, salespersonId, partnerId, totalCommission, isShared) => {
    try {
      if (!saleId || !salespersonId) {
        return { success: false, error: 'Missing saleId or salespersonId' };
      }
      const total = parseFloat(totalCommission) || 0;

      // Denormalize key sale fields into commissions for dashboard simplicity
      const { data: sale, error: saleErr } = await supabase
        ?.from('sales')
        ?.select('sale_date, stock_number, customer_name, vehicle_type, status, salesperson_id, sales_partner_id')
        ?.eq('id', saleId)
        ?.single();

      if (saleErr) {
        return { success: false, error: `Failed to fetch sale for commission write-through: ${saleErr?.message}` };
      }

      const baseFields = {
        sale_id: saleId,
        sale_date: sale?.sale_date || null,
        stock_number: sale?.stock_number || null,
        customer_name: sale?.customer_name || null,
        vehicle_type: sale?.vehicle_type || null,
        status: sale?.status || null,
        salesperson_id: sale?.salesperson_id || null,
        sales_partner_id: sale?.sales_partner_id || null
      };

      const rows = [];
      if (isShared && partnerId) {
        const share = Math.round((total * 0.5) * 100) / 100; // 2-dec precision
        rows.push(
          { ...baseFields, user_id: salespersonId, role: 'primary', amount: share },
          { ...baseFields, user_id: partnerId, role: 'partner', amount: share }
        );
      } else {
        rows.push({ ...baseFields, user_id: salespersonId, role: 'primary', amount: total });
      }

      const { error } = await supabase
        ?.from('commissions')
        ?.insert(rows);

      if (error) {
        return { success: false, error: error?.message };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Failed to create commission records' };
    }
  },

  // Replace commission records for a sale (delete existing and insert new based on current state)
  replaceCommissionRecordsForSale: async (saleId, salespersonId, partnerId, totalCommission, isShared) => {
    try {
      if (!saleId || !salespersonId) {
        return { success: false, error: 'Missing saleId or salespersonId' };
      }
      // delete existing
      const { error: delErr } = await supabase
        ?.from('commissions')
        ?.delete()
        ?.eq('sale_id', saleId);

      if (delErr) {
        return { success: false, error: delErr?.message };
      }

      // recreate
      return await salesService.createCommissionRecords(
        saleId,
        salespersonId,
        partnerId,
        totalCommission,
        isShared
      );
    } catch (e) {
      return { success: false, error: 'Failed to replace commission records' };
    }
  },

  // Create new sale
  createSale: async (saleData) => {
    try {
      const { data, error } = await supabase?.from('sales')?.insert({
          salesperson_id: saleData?.salesperson_id,
          stock_number: saleData?.stock_number,
          customer_name: saleData?.customer_name,
          vehicle_type: saleData?.vehicle_type,
          sale_price: saleData?.sale_price,
          sale_date: saleData?.sale_date || new Date()?.toISOString()?.split('T')?.[0],
          accessories_value: saleData?.accessories_value || 0,
          warranty_selling_price: saleData?.warranty_selling_price || 0,
          warranty_cost: saleData?.warranty_cost || 0,
          service_price: saleData?.service_price || 0,
          service_cost: saleData?.service_cost || 0,
          spiff_bonus: saleData?.spiff_bonus || 0,
          spiff_comments: saleData?.spiff_comments || null,
          spiff_proof_url: saleData?.spiff_proof_url || null,
          is_shared_sale: saleData?.is_shared_sale || false,
          sales_partner_id: saleData?.sales_partner_id || null,
          warranty_screenshot_url: saleData?.warranty_screenshot_url || null,
          service_screenshot_url: saleData?.service_screenshot_url || null,
          status: saleData?.status || 'pending'
        })?.select()?.single();

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to create sale' };
    }
  },

  // Get user's sales
  getUserSales: async (userId, limit = null) => {
    try {
      let query = supabase?.from('sales')?.select(`
          *,
          sales_partner:sales_partner_id(full_name),
          salesperson:salesperson_id(full_name)
        `)?.or(`salesperson_id.eq.${userId},sales_partner_id.eq.${userId}`)?.order('created_at', { ascending: false });

      if (limit) {
        query = query?.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to fetch sales' };
    }
  },

  // Get sale by ID
  getSaleById: async (saleId) => {
    try {
      const { data, error } = await supabase?.from('sales')?.select(`
          *,
          sales_partner:sales_partner_id(full_name, email),
          salesperson:salesperson_id(full_name, email)
        `)?.eq('id', saleId)?.single();

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch sale details' };
    }
  },

  // Update sale
  updateSale: async (saleId, updates) => {
    try {
      const { data, error } = await supabase?.from('sales')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.eq('id', saleId)?.select()?.single();

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to update sale' };
    }
  },

  // Delete sale
  deleteSale: async (saleId) => {
    try {
      const { error } = await supabase?.from('sales')?.delete()?.eq('id', saleId);

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete sale' };
    }
  },

  // Check for existing sales with same stock number
  checkStockNumber: async (stockNumber, excludeSaleId = null) => {
    try {
      let query = supabase?.from('sales')?.select('id, customer_name, salesperson:salesperson_id(full_name)')?.eq('stock_number', stockNumber);

      if (excludeSaleId) {
        query = query?.neq('id', excludeSaleId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to check stock number' };
    }
  },

  // Get recent sales for dashboard (legacy)
  getRecentSales: async (limit = 10) => {
    try {
      const safeLimit = (typeof limit === 'number' && limit > 0) ? limit : 10;

      const { data, error } = await supabase
        ?.from('sales')
        ?.select(`
          id,
          stock_number,
          customer_name,
          sale_date,
          commission_total,
          is_shared_sale,
          sales_partner_id,
          user_profiles!sales_sales_partner_id_fkey(full_name)
        `)
        ?.order('sale_date', { ascending: false })
        ?.limit(safeLimit);

      if (error) {
        return { success: false, error: error?.message, data: [] };
      }

      const rows = Array.isArray(data) ? data.filter(r => r && typeof r === 'object') : [];

      const shaped = rows.map((r) => {
        const related = Array.isArray(r?.user_profiles) ? r.user_profiles[0] : r?.user_profiles;
        const partnerName = related?.full_name || null;

        return {
          id: r?.id,
          stock_number: r?.stock_number || null,
          customer_name: r?.customer_name || null,
          sale_date: r?.sale_date || null,
          commission_total: r?.commission_total ?? 0,
          is_shared_sale: !!r?.is_shared_sale,
          sales_partner_id: r?.sales_partner_id || null,
          partner_name: partnerName
        };
      });

      return { success: true, data: shaped };
    } catch (e) {
      return { success: false, error: 'Failed to fetch recent sales', data: [] };
    }
  },

  // New: Recent sales for dashboard v2 (uses sales table directly, supports paging and current-month filter)
  // Role behavior: if userRole === 'member' -> only own sales (as primary or partner). Else -> all sales.
  // Pagination: 10 per page by default, up to 5 pages (50 max records).
  getRecentSalesForDashboardV2: async ({
    userId = null,
    userRole = 'member',
    page = 1,
    pageSize = 10,
    restrictToCurrentMonth = true
  } = {}) => {
    try {
      const safeSize = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 10); // 10 per page
      const safePage = Math.min(Math.max(parseInt(page, 10) || 1, 1), 5); // up to 5 pages
      const rangeStart = (safePage - 1) * safeSize;
      const rangeEnd = rangeStart + safeSize - 1;

      let query = supabase
        ?.from('sales')
        ?.select(`
          id,
          stock_number,
          customer_name,
          sale_date,
          status,
          vehicle_type,
          commission_total,
          is_shared_sale,
          salesperson_id,
          sales_partner_id,
          primary:user_profiles!sales_salesperson_id_fkey(full_name),
          partner:user_profiles!sales_sales_partner_id_fkey(full_name)
        `);

      // Filter for current month by default
      if (restrictToCurrentMonth) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        query = query?.gte('sale_date', startStr)?.lte('sale_date', endStr);
      }

      // Scope by role
      if (userRole === 'member' && userId) {
        query = query?.or(`salesperson_id.eq.${userId},sales_partner_id.eq.${userId}`);
      }

      // Order by most recent date then created_at if available
      query = query?.order('sale_date', { ascending: false })?.order('created_at', { ascending: false })?.range(rangeStart, rangeEnd);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error?.message, data: [] };
      }

      const rows = Array.isArray(data) ? data.filter((r) => r && typeof r === 'object') : [];

      const shaped = rows.map((r) => {
        const primaryRel = Array.isArray(r?.primary) ? r.primary[0] : r?.primary;
        const partnerRel = Array.isArray(r?.partner) ? r.partner[0] : r?.partner;

        const primaryName = primaryRel?.full_name || null;
        const partnerName = partnerRel?.full_name || null;

        return {
          id: r?.id,
          stock_number: r?.stock_number || null,
          customer_name: r?.customer_name || null,
          sale_date: r?.sale_date || null,
          commission_total: r?.commission_total ?? 0,
          is_shared_sale: !!r?.is_shared_sale,
          salesperson_id: r?.salesperson_id || null,
          sales_partner_id: r?.sales_partner_id || null,
          primary_name: primaryName,
          partner_name: partnerName,
          status: r?.status || null,
          vehicle_type: r?.vehicle_type || null
        };
      });

      return { success: true, data: shaped, page: safePage, pageSize: safeSize };
    } catch (e) {
      return { success: false, error: 'Failed to fetch recent sales for dashboard', data: [], page, pageSize };
    }
  },

  // Enhanced getSalesStats with better error handling
  getSalesStats: async (userId, startDate = null, endDate = null) => {
    try {
      if (!userId) {
        return { 
          success: false, 
          error: 'User ID is required',
          data: {
            totalCommissions: 0,
            totalSalesValue: 0,
            newCarsSold: 0,
            usedCarsSold: 0,
            totalSales: 0
          }
        };
      }

      let query = supabase?.from('sales')?.select('sale_price, commission_total, vehicle_type, created_at')?.or(`salesperson_id.eq.${userId},sales_partner_id.eq.${userId}`)?.eq('status', 'completed');

      if (startDate) {
        query = query?.gte('sale_date', startDate);
      }

      if (endDate) {
        query = query?.lte('sale_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        return { 
          success: false, 
          error: error?.message,
          data: {
            totalCommissions: 0,
            totalSalesValue: 0,
            newCarsSold: 0,
            usedCarsSold: 0,
            totalSales: 0
          }
        };
      }

      // Enhanced data validation
      const salesData = Array.isArray(data) ? data?.filter(sale => sale && typeof sale === 'object') : [];

      // Calculate statistics with comprehensive null checks
      const stats = {
        totalCommissions: salesData?.reduce((sum, sale) => {
          try {
            const commission = parseFloat(sale?.commission_total || 0);
            return sum + (isNaN(commission) ? 0 : commission);
          } catch (error) {
            console.error('Error processing commission:', error);
            return sum;
          }
        }, 0),
        totalSalesValue: salesData?.reduce((sum, sale) => {
          try {
            const salePrice = parseFloat(sale?.sale_price || 0);
            return sum + (isNaN(salePrice) ? 0 : salePrice);
          } catch (error) {
            console.error('Error processing sale price:', error);
            return sum;
          }
        }, 0),
        newCarsSold: salesData?.filter(sale => sale && sale?.vehicle_type === 'new')?.length,
        usedCarsSold: salesData?.filter(sale => sale && sale?.vehicle_type === 'used')?.length,
        totalSales: salesData?.length
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('getSalesStats error:', error);
      return { 
        success: false, 
        error: 'Failed to fetch sales statistics',
        data: {
          totalCommissions: 0,
          totalSalesValue: 0,
          newCarsSold: 0,
          usedCarsSold: 0,
          totalSales: 0
        }
      };
    }
  },

  // Get all salespeople for shared sales dropdown
  // Only include users with role = 'member' as requested, and optionally exclude current user
  getSalespeople: async (excludeUserId = null) => {
    try {
      let query = supabase
        ?.from('user_profiles')
        ?.select('id, full_name, email, role')
        ?.eq('role', 'member')
        ?.order('full_name');

      if (excludeUserId) {
        query = query?.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error?.message };
      }

      // Filter valid rows and ensure we only return members
      const unique = (data || []).filter(
        (u) => u && u.id && u.full_name && u.email && u.role === 'member'
      );

      return { success: true, data: unique };
    } catch (error) {
      return { success: false, error: 'Failed to fetch salespeople' };
    }
  },

  // Enhanced getAllSales with better error handling
  getAllSales: async (limit = null) => {
    try {
      let query = supabase?.from('sales')?.select(`
          *,
          sales_partner:sales_partner_id(full_name),
          salesperson:salesperson_id(full_name)
        `)?.order('created_at', { ascending: false });

      if (limit && typeof limit === 'number' && limit > 0) {
        query = query?.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('getAllSales error:', error);
        return { success: false, error: error?.message, data: [] };
      }

      // Validate and filter data
      const validData = Array.isArray(data) ? data?.filter(sale => sale && typeof sale === 'object') : [];

      return { success: true, data: validData };
    } catch (error) {
      console.error('getAllSales error:', error);
      return { success: false, error: 'Failed to fetch all sales', data: [] };
    }
  },

  // Enhanced getAllSalesStats with better error handling (no per-user attribution needed here)
  getAllSalesStats: async (startDate = null, endDate = null) => {
    try {
      let query = supabase
        ?.from('sales')
        ?.select(
          'sale_price, commission_total, vehicle_type, created_at, sale_date'
        )
        ?.eq('status', 'completed');

      if (startDate) {
        query = query?.gte('sale_date', startDate);
      }

      if (endDate) {
        query = query?.lte('sale_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('getAllSalesStats error:', error);
        return {
          success: false,
          error: error?.message,
          data: {
            totalCommissions: 0,
            totalSalesValue: 0,
            newCarsSold: 0,
            usedCarsSold: 0,
            totalSales: 0
          }
        };
      }

      const salesData = Array.isArray(data)
        ? data?.filter((sale) => sale && typeof sale === 'object')
        : [];

      const stats = {
        totalCommissions: salesData?.reduce((sum, sale) => {
          try {
            const commission = parseFloat(sale?.commission_total || 0);
            return sum + (isNaN(commission) ? 0 : commission);
          } catch (error) {
            console.error('Error processing commission:', error);
            return sum;
          }
        }, 0),
        totalSalesValue: salesData?.reduce((sum, sale) => {
          try {
            const salePrice = parseFloat(sale?.sale_price || 0);
            return sum + (isNaN(salePrice) ? 0 : salePrice);
          } catch (error) {
            console.error('Error processing sale price:', error);
            return sum;
          }
        }, 0),
        newCarsSold: salesData?.filter(
          (sale) => sale && sale?.vehicle_type === 'new'
        )?.length,
        usedCarsSold: salesData?.filter(
          (sale) => sale && sale?.vehicle_type === 'used'
        )?.length,
        totalSales: salesData?.length
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('getAllSalesStats error:', error);
      return {
        success: false,
        error: 'Failed to fetch all sales statistics',
        data: {
          totalCommissions: 0,
          totalSalesValue: 0,
          newCarsSold: 0,
          usedCarsSold: 0,
          totalSales: 0
        }
      };
    }
  }
};

export default salesService;
