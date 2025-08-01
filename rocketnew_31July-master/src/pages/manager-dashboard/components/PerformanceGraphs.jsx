import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { TrendingUp, DollarSign, Target, BarChart3, LineChart, Download } from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import managerService from '../../../utils/managerService';
import Icon from '../../../components/AppIcon';


export default function PerformanceGraphs() {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState({
    revenueData: [],
    commissionsData: [],
    salesCountData: [],
    combinedData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('last90'); // last30, last90, last180, ytd
  const [chartType, setChartType] = useState('line'); // line, bar, area
  const [activeMetric, setActiveMetric] = useState('all'); // all, revenue, commissions, sales

  // Load performance graph data
  useEffect(() => {
    let isMounted = true;

    const loadPerformanceGraphs = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Verify manager access
        await managerService?.verifyManagerAccess(user?.id);

        // Fetch performance trends data
        const data = await managerService?.getPerformanceTrends(user?.id, dateRange);
        
        if (isMounted) {
          setPerformanceData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load performance graphs');
          console.error('Performance graphs loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPerformanceGraphs();

    return () => {
      isMounted = false;
    };
  }, [user?.id, dateRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleExportData = () => {
    // Export performance data to CSV
    const csvData = performanceData?.combinedData?.map(item => ({
      Date: item?.date,
      Revenue: item?.revenue,
      Commissions: item?.commissions,
      'Sales Count': item?.salesCount
    }));
    
    const csvContent = [
      Object.keys(csvData?.[0])?.join(','),
      ...csvData?.map(row => Object.values(row)?.join(','))
    ]?.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_data_${dateRange}.csv`;
    a?.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)]?.map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Performance Graphs</h3>
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

  const dateRangeOptions = [
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'last90', label: 'Last 90 Days' },
    { value: 'last180', label: 'Last 6 Months' },
    { value: 'ytd', label: 'Year to Date' }
  ];

  const chartTypeOptions = [
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'area', label: 'Area Chart', icon: TrendingUp }
  ];

  const metricOptions = [
    { value: 'all', label: 'All Metrics', color: '#6B7280' },
    { value: 'revenue', label: 'Revenue Only', color: '#10B981' },
    { value: 'commissions', label: 'Commissions Only', color: '#3B82F6' },
    { value: 'sales', label: 'Sales Count Only', color: '#F59E0B' }
  ];

  // Render appropriate chart based on selected type and metric
  const renderChart = () => {
    const commonProps = {
      data: performanceData?.combinedData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    const chartComponents = {
      line: RechartsLineChart,
      bar: BarChart,
      area: AreaChart
    };

    const Chart = chartComponents?.[chartType];

    return (
      <ResponsiveContainer width="100%" height={400}>
        <Chart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000)?.toFixed(0)}k`} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            labelFormatter={(label) => `Date: ${formatDate(label)}`}
            formatter={(value, name) => {
              if (name === 'Sales Count') return [value, name];
              return [formatCurrency(value), name];
            }}
          />
          <Legend />
          
          {(activeMetric === 'all' || activeMetric === 'revenue') && (
            chartType === 'line' ? (
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Revenue"
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                yAxisId="left"
              />
            ) : chartType === 'bar' ? (
              <Bar dataKey="revenue" fill="#10B981" name="Revenue" yAxisId="left" />
            ) : (
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stackId="1"
                stroke="#10B981" 
                fill="#10B981"
                fillOpacity={0.6}
                name="Revenue"
                yAxisId="left"
              />
            )
          )}
          
          {(activeMetric === 'all' || activeMetric === 'commissions') && (
            chartType === 'line' ? (
              <Line 
                type="monotone" 
                dataKey="commissions" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Commissions"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                yAxisId="left"
              />
            ) : chartType === 'bar' ? (
              <Bar dataKey="commissions" fill="#3B82F6" name="Commissions" yAxisId="left" />
            ) : (
              <Area 
                type="monotone" 
                dataKey="commissions" 
                stackId="1"
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Commissions"
                yAxisId="left"
              />
            )
          )}
          
          {(activeMetric === 'all' || activeMetric === 'sales') && (
            chartType === 'line' ? (
              <Line 
                type="monotone" 
                dataKey="salesCount" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Sales Count"
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                yAxisId="right"
              />
            ) : chartType === 'bar' ? (
              <Bar dataKey="salesCount" fill="#F59E0B" name="Sales Count" yAxisId="right" />
            ) : (
              <Area 
                type="monotone" 
                dataKey="salesCount" 
                stackId="2"
                stroke="#F59E0B" 
                fill="#F59E0B"
                fillOpacity={0.6}
                name="Sales Count"
                yAxisId="right"
              />
            )
          )}
        </Chart>
      </ResponsiveContainer>
    );
  };

  // Calculate summary statistics
  const summaryStats = {
    totalRevenue: performanceData?.combinedData?.reduce((sum, item) => sum + (item?.revenue || 0), 0),
    totalCommissions: performanceData?.combinedData?.reduce((sum, item) => sum + (item?.commissions || 0), 0),
    totalSales: performanceData?.combinedData?.reduce((sum, item) => sum + (item?.salesCount || 0), 0),
    averageRevenue: performanceData?.combinedData?.length > 0 
      ? performanceData?.combinedData?.reduce((sum, item) => sum + (item?.revenue || 0), 0) / performanceData?.combinedData?.length 
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Graphs</h2>
          <p className="text-gray-600 mt-1">
            Separate performance graphs for Revenue, Commissions, and Sales Count trends
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e?.target?.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dateRangeOptions?.map(option => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <DollarSign size={20} className="text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Total Revenue</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(summaryStats?.totalRevenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp size={20} className="text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Commissions</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(summaryStats?.totalCommissions)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Target size={20} className="text-amber-600" />
            <div>
              <p className="text-sm text-amber-600 font-medium">Total Sales</p>
              <p className="text-xl font-bold text-amber-700">{summaryStats?.totalSales}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 size={20} className="text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Avg Daily Revenue</p>
              <p className="text-xl font-bold text-purple-700">{formatCurrency(summaryStats?.averageRevenue)}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Chart Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Chart Type:</span>
            <div className="flex space-x-1">
              {chartTypeOptions?.map(option => {
                const Icon = option?.icon;
                return (
                  <button
                    key={option?.value}
                    onClick={() => setChartType(option?.value)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors ${
                      chartType === option?.value 
                        ? 'bg-blue-600 text-white' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{option?.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Show:</span>
            <select
              value={activeMetric}
              onChange={(e) => setActiveMetric(e?.target?.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {metricOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Main Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Performance Trends - {dateRangeOptions?.find(opt => opt?.value === dateRange)?.label}
        </h3>
        {renderChart()}
      </div>
      {/* Individual Metric Charts */}
      {activeMetric === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign size={20} className="text-green-600" />
              <span>Revenue Trends</span>
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={performanceData?.combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000)?.toFixed(0)}k`} />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  fill="#10B981"
                  fillOpacity={0.6}
                  yAxisId="left"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Commissions Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingUp size={20} className="text-blue-600" />
              <span>Commission Trends</span>
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={performanceData?.combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000)?.toFixed(0)}k`} />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  formatter={(value) => [formatCurrency(value), 'Commissions']}
                />
                <Area 
                  type="monotone" 
                  dataKey="commissions" 
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  yAxisId="left"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sales Count Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Target size={20} className="text-amber-600" />
              <span>Sales Count Trends</span>
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={performanceData?.combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis yAxisId="left" />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  formatter={(value) => [value, 'Sales Count']}
                />
                <Bar dataKey="salesCount" fill="#F59E0B" yAxisId="left" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
