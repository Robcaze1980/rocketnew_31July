import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart3, TrendingUp, Calendar, Filter, Download } from 'lucide-react';

import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import AIDataAnalyst from '../../components/AIDataAnalyst';
import { useAIAnalyst } from '../../contexts/AIAnalystContext';

import KPIGrid from './components/KPIGrid';
import PerformanceCharts from './components/PerformanceCharts';
import TeamComparison from './components/TeamComparison';
import GoalTracking from './components/GoalTracking';
import Icon from '../../components/AppIcon';


const DepartmentKPIs = () => {
  const { user, userProfile } = useAuth();
  const { updatePageContext } = useAIAnalyst();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [kpis, setKpis] = useState([]);
  const [goals, setGoals] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [chartData, setChartData] = useState([]);

  const tabs = [
    { id: 'overview', name: 'KPI Overview', icon: BarChart3 },
    { id: 'trends', name: 'Performance Trends', icon: TrendingUp },
    { id: 'comparison', name: 'Team Comparison', icon: Filter },
    { id: 'goals', name: 'Goal Tracking', icon: Calendar }
  ];

  const timeRanges = [
    { id: 'current', label: 'This Month', value: null },
    { id: 'last3', label: 'Last 3 Months', months: 3 },
    { id: 'last6', label: 'Last 6 Months', months: 6 },
    { id: 'ytd', label: 'Year to Date', value: 'ytd' }
  ];

  const handleDateRangeChange = (range) => {
    if (range?.value === null) {
      setDateRange(null);
    } else if (range?.value === 'ytd') {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), 0, 1);
      setDateRange({
        startDate: startDate?.toISOString()?.split('T')?.[0],
        endDate: now?.toISOString()?.split('T')?.[0]
      });
    } else if (range?.months) {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - range.months, 1);
      setDateRange({
        startDate: startDate?.toISOString()?.split('T')?.[0],
        endDate: now?.toISOString()?.split('T')?.[0]
      });
    }
  };

  const handleExportData = () => {
    // Export functionality - would generate CSV/PDF reports
    console.log('Exporting department KPI data...');
  };

  // Update AI context when component mounts or data changes
  useEffect(() => {
    const context = {
      kpiData: kpis || [],
      departmentGoals: goals || [],
      teamComparison: comparisonData || [],
      performanceCharts: chartData || [],
      targetProgress: {
        salesTarget: 85,
        revenueTarget: 92,
        customerSatisfaction: 88
      },
      achievements: [
        { metric: 'Monthly Sales', achievement: '105%', status: 'exceeded' },
        { metric: 'Revenue Target', achievement: '98%', status: 'on-track' },
        { metric: 'Team Goals', achievement: '87%', status: 'behind' }
      ]
    };
    
    updatePageContext('Goal Tracking', context);
  }, [kpis, goals, comparisonData, chartData]);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
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
              <h1 className="text-3xl font-bold text-foreground">Department KPIs</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive departmental performance metrics and key performance indicators
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Date Range Selector */}
              <select
                onChange={(e) => {
                  const range = timeRanges?.find(r => r?.id === e?.target?.value);
                  if (range) handleDateRangeChange(range);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeRanges?.map(range => (
                  <option key={range?.id} value={range?.id}>
                    {range?.label}
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
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <KPIGrid dateRange={dateRange} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PerformanceCharts dateRange={dateRange} />
                  <GoalTracking dateRange={dateRange} />
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-6">
                <PerformanceCharts dateRange={dateRange} showTrends={true} />
              </div>
            )}

            {activeTab === 'comparison' && (
              <div className="space-y-6">
                <TeamComparison dateRange={dateRange} />
              </div>
            )}

            {activeTab === 'goals' && (
              <div className="space-y-6">
                <GoalTracking dateRange={dateRange} expanded={true} />
              </div>
            )}
          </div>
        </main>
      </div>
      <AIDataAnalyst />
    </div>
  );
};

export default DepartmentKPIs;
