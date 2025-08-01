import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import analyticsService from '../../../utils/analyticsService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import Icon from '../../../components/AppIcon';


const AnalyticsDashboard = ({ filters }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    performanceMetrics: [],
    teamComparison: [],
    conversionData: [],
    trendData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState('trends');

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Load various analytics data
        const [benchmarksResult, trendsResult] = await Promise.all([
          analyticsService.getTeamBenchmarks(user.id),
          analyticsService.getPerformanceTrends(user.id, 90)
        ]);

        if (isMounted) {
          const mockTrendData = [
            { month: 'Jan', sales: 12, revenue: 145000, conversion: 18.5 },
            { month: 'Feb', sales: 15, revenue: 187000, conversion: 22.1 },
            { month: 'Mar', sales: 18, revenue: 225000, conversion: 24.7 },
            { month: 'Apr', sales: 14, revenue: 168000, conversion: 19.8 },
            { month: 'May', sales: 21, revenue: 267000, conversion: 28.3 },
            { month: 'Jun', sales: 19, revenue: 234000, conversion: 25.9 }
          ];

          const mockTeamData = [
            { name: 'John D.', sales: 45, revenue: 567000, efficiency: 92 },
            { name: 'Sarah M.', sales: 38, revenue: 489000, efficiency: 87 },
            { name: 'Mike R.', sales: 42, revenue: 534000, efficiency: 89 },
            { name: 'Lisa K.', sales: 35, revenue: 445000, efficiency: 82 }
          ];

          const mockConversionData = [
            { stage: 'Leads', value: 1200, percentage: 100 },
            { stage: 'Qualified', value: 840, percentage: 70 },
            { stage: 'Proposals', value: 420, percentage: 35 },
            { stage: 'Negotiations', value: 294, percentage: 25 },
            { stage: 'Closed', value: 168, percentage: 14 }
          ];

          setDashboardData({
            performanceMetrics: benchmarksResult.data || {},
            teamComparison: mockTeamData,
            conversionData: mockConversionData,
            trendData: mockTrendData
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load analytics dashboard');
          console.error('Analytics dashboard loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, filters]);

  const chartOptions = [
    { id: 'trends', label: 'Performance Trends', icon: TrendingUp },
    { id: 'team', label: 'Team Comparison', icon: BarChart3 },
    { id: 'conversion', label: 'Conversion Funnel', icon: PieChartIcon }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading analytics dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Team Average Performance</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Sales:</span>
              <span className="font-semibold">{dashboardData.performanceMetrics?.teamAverage?.sales || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-semibold">${(dashboardData.performanceMetrics?.teamAverage?.revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commission:</span>
              <span className="font-semibold">${(dashboardData.performanceMetrics?.teamAverage?.commission || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Top Performer</h3>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="text-lg font-bold text-gray-900">
              {dashboardData.performanceMetrics?.topPerformer?.full_name || 'N/A'}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-semibold">${(dashboardData.performanceMetrics?.topPerformer?.total_revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sales:</span>
              <span className="font-semibold">{dashboardData.performanceMetrics?.topPerformer?.total_sales || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Performance Benchmarks</h3>
            <PieChartIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Best Sales:</span>
              <span className="font-semibold">{dashboardData.performanceMetrics?.benchmarks?.sales || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Best Revenue:</span>
              <span className="font-semibold">${(dashboardData.performanceMetrics?.benchmarks?.revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Best Commission:</span>
              <span className="font-semibold">${(dashboardData.performanceMetrics?.benchmarks?.commission || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
          <div className="flex space-x-2">
            {chartOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedChart(option.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md ${
                    selectedChart === option.id
                      ? 'bg-blue-600 text-white' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-80">
          {selectedChart === 'trends' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => {
                  if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                  if (name === 'conversion') return [`${value}%`, 'Conversion Rate'];
                  return [value, name];
                }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales" />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#f59e0b" strokeWidth={2} name="Conversion %" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'team' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.teamComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => {
                  if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                  if (name === 'efficiency') return [`${value}%`, 'Efficiency'];
                  return [value, name];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" name="Sales" />
                <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar yAxisId="right" dataKey="efficiency" fill="#f59e0b" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'conversion' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="horizontal" data={dashboardData.conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <Tooltip formatter={(value, name) => [value.toLocaleString(), 'Count']} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Strong Q2 Performance</p>
                <p className="text-xs text-gray-600">Revenue increased by 23% compared to Q1</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Team Consistency</p>
                <p className="text-xs text-gray-600">All team members above 80% efficiency rating</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Conversion Opportunity</p>
                <p className="text-xs text-gray-600">Lead to close rate can improve by 8%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Focus on Lead Quality</p>
                <p className="text-xs text-gray-600">Implement better lead scoring system</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Enhance Training</p>
                <p className="text-xs text-gray-600">Additional coaching for negotiation skills</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Optimize Processes</p>
                <p className="text-xs text-gray-600">Streamline proposal generation workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;