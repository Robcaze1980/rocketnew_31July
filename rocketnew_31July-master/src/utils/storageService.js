import { supabase } from './supabase';

const storageService = {
  // Upload profile photo
  uploadProfilePhoto: async (file, userId) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      return { 
        success: true, 
        data: {
          path: data.path,
          url: urlData.publicUrl
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to upload profile photo' };
    }
  },

  // Upload SPIFF proof document
  uploadSpiffProof: async (file, saleId, userId) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${saleId}-spiff-proof.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('spiff-proofs')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('spiff-proofs')
        .getPublicUrl(fileName);

      return { 
        success: true, 
        data: {
          path: data.path,
          url: urlData.publicUrl
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to upload SPIFF proof' };
    }
  },

  // Upload sale screenshot (warranty or service)
  uploadSaleScreenshot: async (file, saleId, userId, type) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${saleId}-${type}-screenshot.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('sale-screenshots')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('sale-screenshots')
        .getPublicUrl(fileName);

      return { 
        success: true, 
        data: {
          path: data.path,
          url: urlData.publicUrl
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to upload screenshot' };
    }
  },

  // Delete file from storage
  deleteFile: async (bucket, filePath) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete file' };
    }
  }
};

export default storageService;