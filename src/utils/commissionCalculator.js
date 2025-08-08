const commissionCalculator = {
  // Calculate sale commission based on sale price
  calculateSaleCommission: (salePrice) => {
    const price = parseFloat(salePrice) || 0;
    
    if (price >= 30000) return 500;
    if (price >= 20000) return 400;
    if (price >= 10000) return 300;
    if (price > 0) return 200;
    return 0;
  },

  // Calculate accessories commission based on value and vehicle type
  calculateAccessoriesCommission: (accessoriesValue, vehicleType) => {
    const value = parseFloat(accessoriesValue) || 0;
    
    if (vehicleType === 'new') {
      if (value > 998) {
        return Math.floor((value - 998) / 998) * 100;
      }
      return 0;
    } else {
      // Used vehicle
      return Math.floor(value / 850) * 100;
    }
  },

  // Calculate commission based on profit (for warranty and service)
  calculateProfitCommission: (sellingPrice, cost) => {
    const selling = parseFloat(sellingPrice) || 0;
    const costValue = parseFloat(cost) || 0;
    const profit = selling - costValue;
    
    return Math.max(0, Math.floor(profit / 900) * 100);
  },

  // Calculate warranty commission
  calculateWarrantyCommission: (warrantySellingPrice, warrantyCost) => {
    return commissionCalculator.calculateProfitCommission(warrantySellingPrice, warrantyCost);
  },

  // Calculate service commission
  calculateServiceCommission: (servicePrice, serviceCost) => {
    return commissionCalculator.calculateProfitCommission(servicePrice, serviceCost);
  },

  // Calculate total commission
  calculateTotalCommission: (salePrice, accessoriesValue, vehicleType, warrantySellingPrice, warrantyCost, servicePrice, serviceCost, spiffBonus) => {
    const saleCommission = commissionCalculator.calculateSaleCommission(salePrice);
    const accessoriesCommission = commissionCalculator.calculateAccessoriesCommission(accessoriesValue, vehicleType);
    const warrantyCommission = commissionCalculator.calculateWarrantyCommission(warrantySellingPrice, warrantyCost);
    const serviceCommission = commissionCalculator.calculateServiceCommission(servicePrice, serviceCost);
    const spiff = parseFloat(spiffBonus) || 0;

    return {
      sale: saleCommission,
      accessories: accessoriesCommission,
      warranty: warrantyCommission,
      service: serviceCommission,
      spiff: spiff,
      total: saleCommission + accessoriesCommission + warrantyCommission + serviceCommission + spiff
    };
  },

  // Calculate shared sale commission
  calculateSharedCommission: (totalCommission, isSharedSale) => {
    if (isSharedSale) {
      return totalCommission / 2;
    }
    return totalCommission;
  }
};

export default commissionCalculator;