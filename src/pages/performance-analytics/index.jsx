import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart3, TrendingUp, PieChart, Target, Filter, Download, MessageCircle } from 'lucide-react';

import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import AIDataAnalyst from '../../components/AIDataAnalyst';
import { useAIAnalyst } from '../../contexts/AIAnalystContext';

import AnalyticsDashboard from './components/AnalyticsDashboard';
import FunnelAnalysis from './components/FunnelAnalysis';
import ConversionTracking from './components/ConversionTracking';
import PredictiveModeling from './components/PredictiveModeling';
import StatisticalInsights from './components/StatisticalInsights';
import Icon from '../../components/AppIcon';
import AIPerformanceChat from './components/AIPerformanceChat';

// Mock analyticsService for the component
const analyticsService = {
  getTeamBenchmarks: async (userId) => {
    return {
      data: {
        topPerformer: { name: 'John Doe', score: 95 },
        teamAverage: { score: 85, conversions: 12 },
        benchmarks: { target: 90, minimum: 70 },
        teamData: []
      }
    };
  },
  getPerformanceTrends: async (userId, days) => {
    return {
      data: [
        { date: '2024-01-01', performance: 85 },
        { date: '2024-01-02', performance: 90 }
      ]
    };
  },
  getTeamTargets: async (userId) => {
    return {
      data: [
        { metric: 'Sales', target: 100, current: 85 }
      ]
    };
  }
};

const PerformanceAnalytics = () => {
  const { user, userProfile } = useAuth();
  const { updatePageContext } = useAIAnalyst();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    dateRange: 'last30',
    teamMember: 'all',
    vehicleType: 'all',
    commissionStructure: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiChatVisible, setAiChatVisible] = useState(false);
  const [performanceContext, setPerformanceContext] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [modelingData, setModelingData] = useState([]);
  const [insights, setInsights] = useState([]);

  const tabs = [
    { id: 'dashboard', name: 'Analytics Dashboard', icon: BarChart3 },
    { id: 'funnel', name: 'Sales Funnel', icon: PieChart },
    { id: 'conversion', name: 'Conversion Tracking', icon: TrendingUp },
    { id: 'predictive', name: 'Predictive Modeling', icon: Target },
    { id: 'insights', name: 'Statistical Insights', icon: Filter }
  ];

  const dateRangeOptions = [
    { value: 'last7', label: 'Last 7 Days' },
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'last90', label: 'Last 90 Days' },
    { value: 'last180', label: 'Last 6 Months' },
    { value: 'last365', label: 'Last Year' },
    { value: 'ytd', label: 'Year to Date' }
  ];

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleExportAnalytics = () => {
    // Export analytics data functionality
    console.log('Exporting analytics data with filters:', filters);
  };

  useEffect(() => {
    const loadPerformanceContext = async () => {
      if (!user?.id) return;

      try {
        // Load comprehensive performance data for AI context
        const [benchmarksResult, trendsResult, teamTargetsResult] = await Promise.all([
          analyticsService?.getTeamBenchmarks(user?.id),
          analyticsService?.getPerformanceTrends(user?.id, 90),
          analyticsService?.getTeamTargets(user?.id)
        ]);

        const contextData = {
          topPerformer: benchmarksResult?.data?.topPerformer || null,
          teamAverage: benchmarksResult?.data?.teamAverage || {},
          benchmarks: benchmarksResult?.data?.benchmarks || {},
          teamData: benchmarksResult?.data?.teamData || [],
          trends: trendsResult?.data || [],
          goals: teamTargetsResult?.data || []
        };

        setPerformanceContext(contextData);
      } catch (error) {
        console.error('Failed to load performance context for AI:', error);
      }
    };

    loadPerformanceContext();
    setLoading(false);
  }, [user?.id, filters]);

  useEffect(() => {
    const context = {
      analyticsData: performanceData || {},
      activeView: activeTab,
      predictiveModels: modelingData || [],
      statisticalInsights: insights || [],
      trends: [
        { month: 'Current', performance: 95, conversion: 85, revenue: 125000 },
        { month: 'Previous', performance: 92, conversion: 82, revenue: 118000 }
      ],
      keyMetrics: {
        conversionRate: '85%',
        averageRevenue: '$125,000',
        performanceScore: 95,
        improvementAreas: ['Lead Response', 'Follow-up Timing']
      }
    };
    
    updatePageContext('Performance Analytics', context);
  }, [performanceData, activeTab, modelingData, insights]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mt-20">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-4 gap-6">
                {[...Array(4)]?.map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 mr-80">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mt-20">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Advanced analytical tools for deep-dive performance analysis and insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* AI Chat Toggle Button */}
              <button
                onClick={() => setAiChatVisible(!aiChatVisible)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 text-sm transition-all duration-200 shadow-lg"
              >
                <MessageCircle size={16} />
                <span>AI Assistant</span>
                {aiChatVisible && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportAnalytics}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <Download size={16} />
                <span>Export Analytics</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
              <button
                onClick={() => setFilters({
                  dateRange: 'last30',
                  teamMember: 'all',
                  vehicleType: 'all',
                  commissionStructure: 'all'
                })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={filters?.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {dateRangeOptions?.map(option => (
                    <option key={option?.value} value={option?.value}>
                      {option?.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Team Member Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Member
                </label>
                <select
                  value={filters?.teamMember}
                  onChange={(e) => handleFilterChange('teamMember', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Team Members</option>
                  <option value="top-performers">Top Performers</option>
                  <option value="needs-attention">Needs Attention</option>
                </select>
              </div>

              {/* Vehicle Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Category
                </label>
                <select
                  value={filters?.vehicleType}
                  onChange={(e) => handleFilterChange('vehicleType', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              {/* Commission Structure Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Type
                </label>
                <select
                  value={filters?.commissionStructure}
                  onChange={(e) => handleFilterChange('commissionStructure', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Commission Types</option>
                  <option value="base">Base Commission</option>
                  <option value="accessories">Accessories</option>
                  <option value="warranty">Warranty</option>
                  <option value="spiff">Spiff Bonuses</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs?.map((tab) => {
                const Icon = tab?.icon;
                return (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab?.id
                        ? 'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab?.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'dashboard' && (
              <AnalyticsDashboard filters={filters} />
            )}

            {activeTab === 'funnel' && (
              <FunnelAnalysis filters={filters} />
            )}

            {activeTab === 'conversion' && (
              <ConversionTracking filters={filters} />
            )}

            {activeTab === 'predictive' && (
              <PredictiveModeling filters={filters} />
            )}

            {activeTab === 'insights' && (
              <StatisticalInsights filters={filters} />
            )}
          </div>
        </main>
      </div>
      {/* AI Performance Chat Component */}
      <AIPerformanceChat
        performanceData={performanceContext}
        isVisible={aiChatVisible}
        onToggle={() => setAiChatVisible(!aiChatVisible)}
      />
      <AIDataAnalyst />
    </div>
  );
};

export default PerformanceAnalytics;
