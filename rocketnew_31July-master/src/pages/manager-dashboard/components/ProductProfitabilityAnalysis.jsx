// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Shield, Wrench, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label } from 'recharts';
import managerService from '../../../utils/managerService';
import Icon from '../../../components/AppIcon';

export default function ProductProfitabilityAnalysis() {
  const { user } = useAuth();
  const [profitabilityData, setProfitabilityData] = useState({
    warranties: { totalCost: 0, totalIncome: 0, profitMargin: 0, salesCount: 0 },
    maintenance: { totalCost: 0, totalIncome: 0, profitMargin: 0, salesCount: 0 },
    accessories: { totalCost: 0, totalIncome: 0, profitMargin: 0, salesCount: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('current'); // current, previous, last3, ytd, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, trends

  // Load product profitability data
  useEffect(() => {
    let isMounted = true;
    const loadProfitabilityData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        setError(null);
        // Verify manager access
        await managerService?.verifyManagerAccess(user?.id);
        // Prepare date range for the backend
        let dateRangeParam = null;
        if (dateRange === 'current') {
          // Current month
          const now = new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          dateRangeParam = {
            startDate: startDate?.toISOString()?.split('T')?.[0],
            endDate: endDate?.toISOString()?.split('T')?.[0]
          };
        } else if (dateRange === 'previous') {
          // Previous month
          const now = new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          dateRangeParam = {
            startDate: startDate?.toISOString()?.split('T')?.[0],
            endDate: endDate?.toISOString()?.split('T')?.[0]
          };
        } else if (dateRange === 'last3') {
          // Last 3 months
          const now = new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          dateRangeParam = {
            startDate: startDate?.toISOString()?.split('T')?.[0],
            endDate: endDate?.toISOString()?.split('T')?.[0]
          };
        } else if (dateRange === 'ytd') {
          // Year to date
          const now = new Date();
          const startDate = new Date(now.getFullYear(), 0, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          dateRangeParam = {
            startDate: startDate?.toISOString()?.split('T')?.[0],
            endDate: endDate?.toISOString()?.split('T')?.[0]
          };
        } else if (dateRange === 'custom' && customStartDate && customEndDate) {
          // Custom date range
          dateRangeParam = {
            startDate: customStartDate,
            endDate: customEndDate
          };
        }
        // Fetch product profitability analysis
        const data = await managerService?.getProductProfitabilityAnalysis(user?.id, dateRangeParam);
        if (isMounted) {
          setProfitabilityData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load profitability analysis');
          console.error('Profitability analysis loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadProfitabilityData();
    return () => {
      isMounted = false;
    };
  }, [user?.id, dateRange, customStartDate, customEndDate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const formatPercentage = (value) => {
    return `${value?.toFixed(1)}%`;
  };

  const getPeriodDescription = () => {
    const now = new Date();
    switch (dateRange) {
      case 'current':
        return `Current period: ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()} profit breakdown`;
      case 'previous':
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `Previous period: ${prevMonth.toLocaleString('default', { month: 'long' })} ${prevMonth.getFullYear()} profit breakdown`;
      case 'last3':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return `Last 3 months: ${threeMonthsAgo.toLocaleString('default', { month: 'short' })}-${currentMonth.toLocaleString('default', { month: 'short' })} ${now.getFullYear()} profit breakdown`;
      case 'ytd':
        return `Year to date: Jan-${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()} profit breakdown`;
      case 'custom':
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          return `Custom period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()} profit breakdown`;
        }
        return 'Custom period profit breakdown';
      default:
        return 'Current period profit breakdown';
    }
  };


  // Prepare data for charts
  const pieChartData = [
    {
      name: 'Warranties',
      value: profitabilityData?.warranties?.totalIncome - profitabilityData?.warranties?.totalCost,
      income: profitabilityData?.warranties?.totalIncome,
      cost: profitabilityData?.warranties?.totalCost,
      color: '#3B82F6'
    },
    {
      name: 'Accessories',
      value: profitabilityData?.accessories?.totalIncome - profitabilityData?.accessories?.totalCost,
      income: profitabilityData?.accessories?.totalIncome,
      cost: profitabilityData?.accessories?.totalCost,
      color: '#F59E0B'
    },
    {
      name: 'Maintenance',
      value: profitabilityData?.maintenance?.totalIncome - profitabilityData?.maintenance?.totalCost,
      income: profitabilityData?.maintenance?.totalIncome,
      cost: profitabilityData?.maintenance?.totalCost,
      color: '#10B981'
    }
  ];

  const barChartData = [
    {
      category: 'Warranties',
      income: profitabilityData?.warranties?.totalIncome,
      cost: profitabilityData?.warranties?.totalCost,
      profit: profitabilityData?.warranties?.totalIncome - profitabilityData?.warranties?.totalCost,
      margin: profitabilityData?.warranties?.profitMargin
    },
    {
      category: 'Accessories',
      income: profitabilityData?.accessories?.totalIncome,
      cost: profitabilityData?.accessories?.totalCost,
      profit: profitabilityData?.accessories?.totalIncome - profitabilityData?.accessories?.totalCost,
      margin: profitabilityData?.accessories?.profitMargin
    },
    {
      category: 'Maintenance',
      income: profitabilityData?.maintenance?.totalIncome,
      cost: profitabilityData?.maintenance?.totalCost,
      profit: profitabilityData?.maintenance?.totalIncome - profitabilityData?.maintenance?.totalCost,
      margin: profitabilityData?.maintenance?.profitMargin
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)]?.map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Profitability Analysis</h3>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location?.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const productCategories = [
    {
      key: 'warranties',
      title: 'Warranty Sales',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      data: profitabilityData?.warranties
    },
    {
      key: 'accessories',
      title: 'Accessories',
      icon: ShoppingCart,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      data: profitabilityData?.accessories
    },
    {
      key: 'maintenance',
      title: 'Maintenance Services',
      icon: Wrench,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      data: profitabilityData?.maintenance
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Profitability Analysis</h2>
          <p className="text-gray-600 mt-1">
            Analyze total cost vs income and profit margins for warranties, maintenance, and accessories
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'overview' ?'bg-white text-gray-900 shadow' :'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'detailed' ?'bg-white text-gray-900 shadow' :'text-gray-600 hover:text-gray-900'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'trends' ?'bg-white text-gray-900 shadow' :'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trends
            </button>
          </div>
          {/* Date Range Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e?.target?.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current">Current Month</option>
              <option value="previous">Previous Month</option>
              <option value="last3">Last 3 Months</option>
              <option value="ytd">This Year (YTD)</option>
              <option value="custom">Custom Range</option>
            </select>
            {/* Custom Date Pickers */}
            {dateRange === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e?.target?.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e?.target?.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={() => {
                    // Trigger data reload with custom dates by forcing a state update
                    setDateRange('custom');
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'overview' && (
        <>
          {/* Product Category Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {productCategories?.map((category) => {
              const Icon = category?.icon;
              const profit = category?.data?.totalIncome - category?.data?.totalCost;
              const isPositive = profit >= 0;
              return (
                <div key={category?.key} className={`${category?.bgColor} ${category?.borderColor} rounded-lg border p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-full ${category?.bgColor} flex items-center justify-center`}>
                      <Icon size={24} className={category?.color} />
                    </div>
                    <div className="flex items-center space-x-1">
                      {isPositive ? (
                        <ArrowUp size={14} className="text-green-600" />
                      ) : (
                        <ArrowDown size={14} className="text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(category?.data?.profitMargin)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category?.title}</h3>
                      <p className="text-sm text-gray-600">{category?.data?.salesCount} sales</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Income:</span>
                        <span className="font-medium text-green-600">{formatCurrency(category?.data?.totalIncome)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Cost:</span>
                        <span className="font-medium text-red-600">{formatCurrency(category?.data?.totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-2">
                        <span className="text-gray-900">Net Profit:</span>
                        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Profit Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col bg-white rounded-lg border border-gray-200">
              <div className="items-center pb-0 p-6">
                <h3 className="text-lg font-medium text-gray-900">Profit Distribution</h3>
                <p className="text-sm text-gray-500 mt-1">{getPeriodDescription()}</p>
              </div>
              <div className="flex-1 pb-0 p-6">
                <div className="flex">
                  <ResponsiveContainer 
                    width="100%" 
                    height={350}
                    className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[300px] pb-0"
                  >
                    <RechartsPieChart>
                      <Pie 
                        data={pieChartData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={90}
                        outerRadius={135} 
                        fill="#8884d8" 
                        paddingAngle={0}
                        stroke="none"
                      >
                        {pieChartData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry?.color} />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              // Calculate total profit
                              const totalProfit = pieChartData.reduce((sum, item) => sum + (item?.value || 0), 0);
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {formatCurrency(totalProfit)}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground text-sm"
                                  >
                                    Total Profit
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload?.length) {
                            const data = payload?.[0]?.payload;
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                                <p className="font-medium text-gray-900">{data?.name}</p>
                                <p className="text-sm text-gray-600">Profit: {formatCurrency(data?.value)}</p>
                                <p className="text-sm text-gray-600">Income: {formatCurrency(data?.income)}</p>
                                <p className="text-sm text-gray-600">Cost: {formatCurrency(data?.cost)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Cost Analysis</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">{getPeriodDescription()}</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="category" 
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000)?.toFixed(0)}k`} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload?.length) {
                        return (
                          <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
                            <p className="font-medium text-gray-900">{label}</p>
                            {payload?.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry?.color }}>
                                {entry?.name}: {formatCurrency(entry?.value)}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    content={({ payload }) => (
                      <div className="flex justify-center space-x-4 mt-4">
                        {payload?.map((entry, index) => (
                          <div key={`item-${index}`} className="flex items-center">
                            <div 
                              className="w-3 h-3 mr-2 rounded-full" 
                              style={{ backgroundColor: entry?.color }}
                            ></div>
                            <span className="text-sm text-gray-600">{entry?.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  <Bar 
                    dataKey="profit" 
                    stackId="a" 
                    fill="#c7d2fe" 
                    name="Profit"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="income" 
                    stackId="a" 
                    fill="#a5b4fc" 
                    name="Income"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="cost" 
                    stackId="a" 
                    fill="#818cf8" 
                    name="Cost"
                    radius={[0, 0, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {viewMode === 'detailed' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Profitability Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit Margin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg per Sale
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productCategories?.map((category) => {
                  const profit = category?.data?.totalIncome - category?.data?.totalCost;
                  const avgPerSale = category?.data?.salesCount > 0 ? profit / category?.data?.salesCount : 0;
                  const Icon = category?.icon;
                  return (
                    <tr key={category?.key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Icon size={16} className={category?.color} />
                          <span>{category?.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category?.data?.salesCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(category?.data?.totalIncome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(category?.data?.totalCost)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        category?.data?.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(category?.data?.profitMargin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(avgPerSale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'trends' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profitability Trends</h3>
          <p className="text-gray-600 mb-4">
            Historical trend analysis coming soon. This will show profit margin trends over time.
          </p>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Trend charts will be implemented in Phase 2</p>
          </div>
        </div>
      )}
    </div>
  );
}
