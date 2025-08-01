import { supabase } from './supabase';

const activityService = {
  // Get user activity log
  getUserActivity: async (userId, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          sale:sale_id(stock_number, customer_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to fetch activity log' };
    }
  },

  // Log custom activity
  logActivity: async (userId, action, details, saleId = null) => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .insert({
          user_id: userId,
          action,
          details,
          sale_id: saleId
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to log activity' };
    }
  }
};

export default activityService;