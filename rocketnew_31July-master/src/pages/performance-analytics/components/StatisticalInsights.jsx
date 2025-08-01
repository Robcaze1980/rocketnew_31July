import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';


import { Activity, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import Icon from '../../../components/AppIcon';


const StatisticalInsights = ({ filters }) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState({
    correlations: [],
    anomalies: [],
    patterns: [],
    statistics: {}
  });
  const [activeInsightType, setActiveInsightType] = useState('correlations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadStatisticalInsights = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Mock statistical insights data
        const mockCorrelations = [
          { factor1: 'Lead Score', factor2: 'Conversion Rate', correlation: 0.87, strength: 'Strong Positive', pValue: 0.001 },
          { factor1: 'Follow-up Speed', factor2: 'Deal Size', correlation: 0.64, strength: 'Moderate Positive', pValue: 0.023 },
          { factor1: 'Demo Duration', factor2: 'Close Rate', correlation: 0.72, strength: 'Strong Positive', pValue: 0.008 },
          { factor1: 'Quote Response Time', factor2: 'Win Rate', correlation: -0.58, strength: 'Moderate Negative', pValue: 0.034 },
          { factor1: 'Customer Meetings', factor2: 'Revenue', correlation: 0.79, strength: 'Strong Positive', pValue: 0.003 }
        ];

        const mockAnomalies = [
          { date: '2024-07-15', metric: 'Conversion Rate', expected: 18.2, actual: 28.4, deviation: 2.8, significance: 'High' },
          { date: '2024-07-22', metric: 'Average Deal Size', expected: 14800, actual: 22300, deviation: 2.1, significance: 'Medium' },
          { date: '2024-07-28', metric: 'Lead Response Time', expected: 3.2, actual: 1.1, deviation: 3.2, significance: 'High' },
          { date: '2024-07-25', metric: 'Team Productivity', expected: 85, actual: 94, deviation: 1.8, significance: 'Low' }
        ];

        const mockPatterns = [
          { pattern: 'Tuesday Peak Performance', description: 'Conversion rates 23% higher on Tuesdays', frequency: 'Weekly', confidence: 92 },
          { pattern: 'Morning Lead Quality', description: 'Leads generated 9-11 AM have 31% higher close rate', frequency: 'Daily', confidence: 88 },
          { pattern: 'Month-End Urgency', description: 'Deal velocity increases 45% in final week of month', frequency: 'Monthly', confidence: 85 },
          { pattern: 'Weather Impact', description: 'Rainy days correlate with 18% increase in phone leads', frequency: 'Variable', confidence: 76 }
        ];

        const mockStatistics = {
          dataPoints: 1247,
          correlations: 15,
          anomalies: 8,
          patterns: 12,
          confidence: 84.2,
          lastUpdated: new Date().toISOString()
        };

        if (isMounted) {
          setInsights({
            correlations: mockCorrelations,
            anomalies: mockAnomalies,
            patterns: mockPatterns,
            statistics: mockStatistics
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load statistical insights');
          console.error('Statistical insights loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStatisticalInsights();

    return () => {
      isMounted = false;
    };
  }, [user?.id, filters]);

  const insightTypes = [
    { id: 'correlations', label: 'Correlations', icon: TrendingUp },
    { id: 'anomalies', label: 'Anomalies', icon: Zap },
    { id: 'patterns', label: 'Patterns', icon: Activity },
    { id: 'overview', label: 'Overview', icon: BarChart3 }
  ];

  const getCorrelationColor = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return 'text-green-600 bg-green-50';
    if (abs >= 0.6) return 'text-blue-600 bg-blue-50';
    if (abs >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSignificanceColor = (significance) => {
    switch (significance.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
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
        <p className="text-red-800">Error loading statistical insights: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Data Points</h3>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {insights.statistics.dataPoints?.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Analysis basis</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Correlations</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {insights.statistics.correlations}
          </div>
          <div className="text-sm text-gray-500">Significant relationships</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Anomalies</h3>
            <Zap className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {insights.statistics.anomalies}
          </div>
          <div className="text-sm text-gray-500">Statistical outliers</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Model Confidence</h3>
            <BarChart3 className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {insights.statistics.confidence}%
          </div>
          <div className="text-sm text-gray-500">Analysis accuracy</div>
        </div>
      </div>

      {/* Insight Type Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex space-x-2">
          {insightTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setActiveInsightType(type.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-md ${
                  activeInsightType === type.id
                    ? 'bg-blue-600 text-white' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Correlations Analysis */}
      {activeInsightType === 'correlations' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistical Correlations</h3>
          
          <div className="space-y-4">
            {insights.correlations.map((correlation, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">
                      {correlation.factor1} ↔ {correlation.factor2}
                    </h4>
                    <div className={`px-2 py-1 rounded-full text-xs ${getCorrelationColor(correlation.correlation)}`}>
                      {correlation.strength}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      r = {correlation.correlation}
                    </div>
                    <div className="text-xs text-gray-500">
                      p = {correlation.pValue}
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      Math.abs(correlation.correlation) >= 0.8 ? 'bg-green-500' :
                      Math.abs(correlation.correlation) >= 0.6 ? 'bg-blue-500' :
                      Math.abs(correlation.correlation) >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.abs(correlation.correlation) * 100}%` }}
                  ></div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  {correlation.correlation > 0 ? 'Positive correlation' : 'Negative correlation'}: 
                  As {correlation.factor1.toLowerCase()} {correlation.correlation > 0 ? 'increases' : 'decreases'}, 
                  {correlation.factor2.toLowerCase()} tends to {correlation.correlation > 0 ? 'increase' : 'decrease'}.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies Detection */}
      {activeInsightType === 'anomalies' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Anomaly Detection</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expected</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deviation</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Significance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {insights.anomalies.map((anomaly, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(anomaly.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {anomaly.metric}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {typeof anomaly.expected === 'number' && anomaly.expected > 1000 
                        ? anomaly.expected.toLocaleString() 
                        : anomaly.expected}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      {typeof anomaly.actual === 'number' && anomaly.actual > 1000 
                        ? anomaly.actual.toLocaleString() 
                        : anomaly.actual}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {anomaly.deviation}σ
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getSignificanceColor(anomaly.significance)}`}>
                        {anomaly.significance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pattern Recognition */}
      {activeInsightType === 'patterns' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Behavioral Patterns</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.patterns.map((pattern, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{pattern.pattern}</h4>
                  <div className={`text-sm font-semibold ${getConfidenceColor(pattern.confidence)}`}>
                    {pattern.confidence}% confidence
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {pattern.frequency}
                  </span>
                  <div className="w-24">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getConfidenceColor(pattern.confidence).includes('green') ? 'bg-green-500' : 
                          getConfidenceColor(pattern.confidence).includes('blue') ? 'bg-blue-500' : 'bg-yellow-500'}`}
                        style={{ width: `${pattern.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistical Overview */}
      {activeInsightType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Statistical Findings</h3>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-green-900">Strong Lead Quality Correlation</p>
                <p className="text-sm text-green-700">87% correlation between lead score and conversion</p>
                <p className="text-xs text-green-600 mt-1">Focus on high-quality lead sources</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">Demo Impact Analysis</p>
                <p className="text-sm text-blue-700">72% correlation between demo length and close rate</p>
                <p className="text-xs text-blue-600 mt-1">Invest in comprehensive product demonstrations</p>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="font-medium text-orange-900">Timing Anomalies Detected</p>
                <p className="text-sm text-orange-700">Tuesday performance consistently 23% above average</p>
                <p className="text-xs text-orange-600 mt-1">Consider scheduling important activities on Tuesdays</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistical Confidence</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Data Quality</span>
                <span className="text-sm font-semibold text-green-600">95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Model Accuracy</span>
                <span className="text-sm font-semibold text-blue-600">84%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '84%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pattern Recognition</span>
                <span className="text-sm font-semibold text-purple-600">89%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Last analysis: {new Date(insights.statistics.lastUpdated).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Next update: Automated daily at 6:00 AM
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticalInsights;