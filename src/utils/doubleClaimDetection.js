import salesService from './salesService';

const doubleClaimDetection = {
  // Check for existing sales with the same stock number
  checkForDoubleClaim: async (stockNumber, currentUserId, excludeSaleId = null) => {
    try {
      const result = await salesService.checkStockNumber(stockNumber, excludeSaleId);
      
      if (!result.success) {
        return {
          hasConflict: false,
          warning: null,
          error: result.error
        };
      }

      const existingSales = result.data || [];
      
      // Filter out sales by the same user (allowed for edits)
      const conflictingSales = existingSales.filter(sale => 
        sale.salesperson?.id !== currentUserId
      );

      if (conflictingSales.length > 0) {
        const conflictSale = conflictingSales[0];
        return {
          hasConflict: true,
          warning: `⚠️ Stock number ${stockNumber} is already claimed by ${conflictSale.salesperson?.full_name || 'another salesperson'} for customer ${conflictSale.customer_name}. Please verify this is a legitimate shared sale or check the stock number.`,
          conflictingSale: conflictSale
        };
      }

      return {
        hasConflict: false,
        warning: null
      };

    } catch (error) {
      return {
        hasConflict: false,
        warning: null,
        error: 'Failed to check for duplicate stock numbers'
      };
    }
  },

  // Get warning message for double claim
  getDoubleClaimWarning: (stockNumber, conflictingSale) => {
    if (!conflictingSale) return null;
    
    return `⚠️ POTENTIAL DOUBLE CLAIM DETECTED
    
Stock Number: ${stockNumber}
Already claimed by: ${conflictingSale.salesperson?.full_name || 'Unknown'}
Customer: ${conflictingSale.customer_name}

If this is a legitimate shared sale, please:
1. Enable "Shared Sale" option below
2. Select the correct sales partner
3. Ensure both parties agree to the commission split

If this is an error, please verify the stock number or contact your manager.`;
  },

  // Validate shared sale setup
  validateSharedSale: (isSharedSale, salesPartnerId, conflictingSale) => {
    if (!conflictingSale) return { isValid: true };
    
    if (!isSharedSale) {
      return {
        isValid: false,
        message: 'This stock number is already claimed. Please enable shared sale or use a different stock number.'
      };
    }

    if (!salesPartnerId) {
      return {
        isValid: false,
        message: 'Please select the sales partner for this shared sale.'
      };
    }

    if (salesPartnerId !== conflictingSale.salesperson?.id) {
      return {
        isValid: false,
        message: 'The selected sales partner does not match the original claimant of this stock number.'
      };
    }

    return { isValid: true };
  }
};

export default doubleClaimDetection;