import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, Target, AlertTriangle } from 'lucide-react';

const PredictiveModeling = ({ filters }) => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState({
    salesForecast: [],
    performancePredictions: [],
    goalAchievement: {},
    riskAnalysis: []
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPredictiveData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Mock predictive modeling data
        const mockSalesForecast = [
          { date: '2024-07-30', predicted_sales: 18, confidence: 85, lower_bound: 15, upper_bound: 21 },
          { date: '2024-08-06', predicted_sales: 22, confidence: 82, lower_bound: 18, upper_bound: 26 },
          { date: '2024-08-13', predicted_sales: 25, confidence: 78, lower_bound: 20, upper_bound: 30 },
          { date: '2024-08-20', predicted_sales: 21, confidence: 80, lower_bound: 17, upper_bound: 25 },
          { date: '2024-08-27', predicted_sales: 28, confidence: 76, lower_bound: 22, upper_bound: 34 }
        ];

        const mockPerformancePredictions = [
          { name: 'John D.', current_performance: 92, predicted_performance: 94, trend: 'up', confidence: 88 },
          { name: 'Sarah M.', current_performance: 87, predicted_performance: 89, trend: 'up', confidence: 85 },
          { name: 'Mike R.', current_performance: 89, predicted_performance: 86, trend: 'down', confidence: 82 },
          { name: 'Lisa K.', current_performance: 82, predicted_performance: 85, trend: 'up', confidence: 79 }
        ];

        const mockGoalAchievement = {
          monthly_revenue: { probability: 78, current_progress: 65, needed_pace: 1.2 },
          monthly_sales: { probability: 85, current_progress: 72, needed_pace: 1.1 },
          team_targets: { probability: 82, current_progress: 68, needed_pace: 1.15 }
        };

        const mockRiskAnalysis = [
          { risk: 'John D. Performance Decline', probability: 23, impact: 'Medium', timeline: '2 weeks' },
          { risk: 'Monthly Revenue Target Miss', probability: 22, impact: 'High', timeline: '3 weeks' },
          { risk: 'Lead Quality Drop', probability: 18, impact: 'Medium', timeline: '1 week' },
          { risk: 'Market Seasonality Impact', probability: 35, impact: 'Low', timeline: '4 weeks' }
        ];

        if (isMounted) {
          setPredictions({
            salesForecast: mockSalesForecast,
            performancePredictions: mockPerformancePredictions,
            goalAchievement: mockGoalAchievement,
            riskAnalysis: mockRiskAnalysis
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load predictive modeling data');
          console.error('Predictive modeling loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPredictiveData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, filters, selectedTimeframe]);

  const timeframeOptions = [
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' },
    { value: '90', label: '90 Days' }
  ];

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'text-green-600 bg-green-50';
    if (confidence >= 75) return 'text-blue-600 bg-blue-50';
    if (confidence >= 65) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskColor = (probability) => {
    if (probability >= 30) return 'text-red-600 bg-red-50';
    if (probability >= 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getImpactColor = (impact) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        <p className="text-red-800">Error loading predictive modeling: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prediction Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">Predictive Analytics</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Forecast Period:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeframeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500">
              AI Model Accuracy: 84%
            </div>
          </div>
        </div>
      </div>

      {/* Goal Achievement Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Monthly Revenue Goal</h3>
            <Target className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-gray-900">
              {predictions.goalAchievement.monthly_revenue?.probability}%
            </div>
            <div className="text-sm text-gray-600">Achievement Probability</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${predictions.goalAchievement.monthly_revenue?.probability}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              Need {predictions.goalAchievement.monthly_revenue?.needed_pace}x current pace
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Monthly Sales Goal</h3>
            <Target className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-gray-900">
              {predictions.goalAchievement.monthly_sales?.probability}%
            </div>
            <div className="text-sm text-gray-600">Achievement Probability</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${predictions.goalAchievement.monthly_sales?.probability}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              Need {predictions.goalAchievement.monthly_sales?.needed_pace}x current pace
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Team Targets</h3>
            <Target className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-gray-900">
              {predictions.goalAchievement.team_targets?.probability}%
            </div>
            <div className="text-sm text-gray-600">Achievement Probability</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${predictions.goalAchievement.team_targets?.probability}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              Need {predictions.goalAchievement.team_targets?.needed_pace}x current pace
            </div>
          </div>
        </div>
      </div>

      {/* Sales Forecast Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Forecast with Confidence Intervals</h3>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictions.salesForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'confidence') return [`${value}%`, 'Confidence'];
                  return [value, name];
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="upper_bound" 
                stroke="#94a3b8" 
                strokeDasharray="5 5"
                name="Upper Bound"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="predicted_sales" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Predicted Sales"
              />
              <Line 
                type="monotone" 
                dataKey="lower_bound" 
                stroke="#94a3b8" 
                strokeDasharray="5 5"
                name="Lower Bound"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Performance Predictions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Individual Performance Predictions</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Member</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Predicted</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Confidence</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions.performancePredictions.map((prediction, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {prediction.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {prediction.current_performance}%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                    {prediction.predicted_performance}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      prediction.trend === 'up' ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
                    }`}>
                      {prediction.trend === 'up' ? '↗️' : '↘️'} {prediction.trend}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getConfidenceColor(prediction.confidence)}`}>
                      {prediction.confidence}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Risk Analysis & Early Warnings</h3>
        </div>
        
        <div className="space-y-4">
          {predictions.riskAnalysis.map((risk, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{risk.risk}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getImpactColor(risk.impact)}`}>
                    {risk.impact} Impact
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getRiskColor(risk.probability)}`}>
                    {risk.probability}% Risk
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Expected Timeline: {risk.timeline}
                </div>
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        risk.probability >= 30 ? 'bg-red-500' :
                        risk.probability >= 20 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(risk.probability * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Strong Performance Trajectory</p>
                <p className="text-xs text-gray-600">85% probability of exceeding sales targets based on current trends</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Seasonal Pattern Recognition</p>
                <p className="text-xs text-gray-600">Model identifies typical Q3 performance boost beginning next week</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Lead Quality Correlation</p>
                <p className="text-xs text-gray-600">Higher lead scores strongly predict 23% better conversion rates</p>
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
                <p className="text-sm font-medium text-gray-900">Monitor Mike R. Performance</p>
                <p className="text-xs text-gray-600">Predicted 3% decline - consider additional support</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Capitalize on Momentum</p>
                <p className="text-xs text-gray-600">Increase lead allocation to high-performing team members</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Prepare for Seasonal Shift</p>
                <p className="text-xs text-gray-600">Adjust inventory and staffing for predicted demand increase</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveModeling;