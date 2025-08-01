import { supabase } from './supabase';

const salesService = {
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
  getSalespeople: async () => {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('id, full_name, email')?.in('role', ['member', 'manager'])?.order('full_name');

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, data: data || [] };
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

  // Enhanced getAllSalesStats with better error handling
  getAllSalesStats: async (startDate = null, endDate = null) => {
    try {
      let query = supabase?.from('sales')?.select('sale_price, commission_total, vehicle_type, created_at, sale_date')?.eq('status', 'completed');

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

      // Enhanced data validation
      const salesData = Array.isArray(data) ? data?.filter(sale => sale && typeof sale === 'object') : [];

      // Calculate statistics for all sales with comprehensive error handling
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