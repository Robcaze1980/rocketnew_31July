import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Percent, Target } from 'lucide-react';

const ConversionTracking = ({ filters }) => {
  const { user } = useAuth();
  const [conversionData, setConversionData] = useState({
    trends: [],
    metrics: {},
    teamComparison: []
  });
  const [selectedMetric, setSelectedMetric] = useState('conversion_rate');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadConversionData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Mock conversion tracking data
        const mockTrendsData = [
          { date: '2024-01-01', conversion_rate: 14.2, avg_deal_size: 12500, time_to_close: 28, lead_quality: 72 },
          { date: '2024-01-15', conversion_rate: 16.8, avg_deal_size: 13200, time_to_close: 26, lead_quality: 75 },
          { date: '2024-02-01', conversion_rate: 18.4, avg_deal_size: 14100, time_to_close: 24, lead_quality: 78 },
          { date: '2024-02-15', conversion_rate: 17.2, avg_deal_size: 13800, time_to_close: 25, lead_quality: 76 },
          { date: '2024-03-01', conversion_rate: 19.6, avg_deal_size: 15200, time_to_close: 22, lead_quality: 81 },
          { date: '2024-03-15', conversion_rate: 21.3, avg_deal_size: 16500, time_to_close: 20, lead_quality: 84 },
          { date: '2024-04-01', conversion_rate: 18.9, avg_deal_size: 14900, time_to_close: 23, lead_quality: 79 },
          { date: '2024-04-15', conversion_rate: 22.1, avg_deal_size: 17200, time_to_close: 19, lead_quality: 86 }
        ];

        const mockMetrics = {
          overall_conversion: { current: 18.7, previous: 16.3, trend: 'up' },
          avg_deal_size: { current: 14800, previous: 13200, trend: 'up' },
          time_to_close: { current: 23, previous: 26, trend: 'down' },
          lead_quality_score: { current: 79, previous: 74, trend: 'up' }
        };

        const mockTeamComparison = [
          { name: 'John D.', conversion_rate: 22.4, deals_closed: 18, avg_size: 16200 },
          { name: 'Sarah M.', conversion_rate: 19.8, deals_closed: 15, avg_size: 14800 },
          { name: 'Mike R.', conversion_rate: 21.1, deals_closed: 17, avg_size: 15400 },
          { name: 'Lisa K.', conversion_rate: 16.2, deals_closed: 12, avg_size: 13200 }
        ];

        if (isMounted) {
          setConversionData({
            trends: mockTrendsData,
            metrics: mockMetrics,
            teamComparison: mockTeamComparison
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load conversion tracking data');
          console.error('Conversion tracking loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadConversionData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, filters]);

  const metricOptions = [
    { id: 'conversion_rate', label: 'Conversion Rate', unit: '%' },
    { id: 'avg_deal_size', label: 'Avg Deal Size', unit: '$' },
    { id: 'time_to_close', label: 'Time to Close', unit: ' days' },
    { id: 'lead_quality', label: 'Lead Quality', unit: '/100' }
  ];

  const getTrendIcon = (trend) => {
    return trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const formatValue = (value, unit) => {
    if (unit === '$') return `$${value.toLocaleString()}`;
    if (unit === '%') return `${value}%`;
    if (unit === ' days') return `${value} days`;
    return `${value}${unit}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
        <p className="text-red-800">Error loading conversion tracking: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Overall Conversion</h3>
            <Percent className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {conversionData.metrics.overall_conversion?.current}%
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getTrendColor(conversionData.metrics.overall_conversion?.trend)}`}>
                {getTrendIcon(conversionData.metrics.overall_conversion?.trend)}
                <span>vs {conversionData.metrics.overall_conversion?.previous}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Avg Deal Size</h3>
            <Target className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${conversionData.metrics.avg_deal_size?.current?.toLocaleString()}
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getTrendColor(conversionData.metrics.avg_deal_size?.trend)}`}>
                {getTrendIcon(conversionData.metrics.avg_deal_size?.trend)}
                <span>vs ${conversionData.metrics.avg_deal_size?.previous?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Time to Close</h3>
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {conversionData.metrics.time_to_close?.current} days
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getTrendColor(conversionData.metrics.time_to_close?.trend)}`}>
                {getTrendIcon(conversionData.metrics.time_to_close?.trend)}
                <span>vs {conversionData.metrics.time_to_close?.previous} days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Lead Quality</h3>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {conversionData.metrics.lead_quality_score?.current}/100
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getTrendColor(conversionData.metrics.lead_quality_score?.trend)}`}>
                {getTrendIcon(conversionData.metrics.lead_quality_score?.trend)}
                <span>vs {conversionData.metrics.lead_quality_score?.previous}/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Trends Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Conversion Trends Over Time</h3>
          <div className="flex space-x-2">
            {metricOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedMetric(option.id)}
                className={`px-3 py-2 text-sm rounded-md ${
                  selectedMetric === option.id
                    ? 'bg-blue-600 text-white' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={conversionData.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tickFormatter={(value) => {
                  const option = metricOptions.find(opt => opt.id === selectedMetric);
                  return formatValue(value, option?.unit || '');
                }}
              />
              <Tooltip 
                formatter={(value) => {
                  const option = metricOptions.find(opt => opt.id === selectedMetric);
                  return [formatValue(value, option?.unit || ''), option?.label || ''];
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Conversion Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Conversion Performance</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Member</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deals Closed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Deal Size</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {conversionData.teamComparison
                .sort((a, b) => b.conversion_rate - a.conversion_rate)
                .map((member, index) => (
                  <tr key={member.name} className={index === 0 ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span>{member.name}</span>
                        {index === 0 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Top</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                      {member.conversion_rate}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {member.deals_closed}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${member.avg_size.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-16 mx-auto">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              member.conversion_rate >= 20 ? 'bg-green-500' :
                              member.conversion_rate >= 18 ? 'bg-blue-500' :
                              member.conversion_rate >= 16 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(member.conversion_rate * 4, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversion Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Insights</h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900">Strong Momentum</p>
              <p className="text-sm text-green-700">Conversion rates up 14.7% this quarter</p>
              <p className="text-xs text-green-600 mt-1">Lead quality improvements showing results</p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">Deal Size Growth</p>
              <p className="text-sm text-blue-700">Average deal size increased by $1,600</p>
              <p className="text-xs text-blue-600 mt-1">Premium product focus paying off</p>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="font-medium text-orange-900">Faster Closures</p>
              <p className="text-sm text-orange-700">Time to close reduced by 3 days</p>
              <p className="text-xs text-orange-600 mt-1">Streamlined process improvements</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Support Lower Performers</p>
                <p className="text-sm text-gray-600">Provide additional coaching for team members below 17% conversion</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Optimize Lead Quality</p>
                <p className="text-sm text-gray-600">Focus on lead sources that generate highest conversion rates</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Scale Best Practices</p>
                <p className="text-sm text-gray-600">Share top performer strategies across the team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionTracking;