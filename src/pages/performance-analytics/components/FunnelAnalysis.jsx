import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FunnelChart, Funnel, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, Target, ArrowRight } from 'lucide-react';

const FunnelAnalysis = ({ filters }) => {
  const { user } = useAuth();
  const [funnelData, setFunnelData] = useState([]);
  const [conversionRates, setConversionRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadFunnelData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Mock funnel data - in real implementation, this would come from API
        const mockFunnelData = [
          { stage: 'Initial Leads', value: 1200, fill: '#3b82f6', dropoff: 0 },
          { stage: 'Qualified Leads', value: 840, fill: '#10b981', dropoff: 30 },
          { stage: 'Product Demo', value: 630, fill: '#f59e0b', dropoff: 25 },
          { stage: 'Proposal Sent', value: 420, fill: '#ef4444', dropoff: 33 },
          { stage: 'Negotiation', value: 294, fill: '#8b5cf6', dropoff: 30 },
          { stage: 'Closed Won', value: 168, fill: '#06b6d4', dropoff: 43 }
        ];

        const mockConversionRates = {
          'Initial Leads → Qualified': { rate: 70, benchmark: 65, status: 'above' },
          'Qualified → Demo': { rate: 75, benchmark: 70, status: 'above' },
          'Demo → Proposal': { rate: 67, benchmark: 75, status: 'below' },
          'Proposal → Negotiation': { rate: 70, benchmark: 65, status: 'above' },
          'Negotiation → Closed': { rate: 57, benchmark: 60, status: 'below' }
        };

        if (isMounted) {
          setFunnelData(mockFunnelData);
          setConversionRates(mockConversionRates);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load funnel analysis');
          console.error('Funnel analysis loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFunnelData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, filters]);

  const calculateConversionRate = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round((current / previous) * 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'above': return 'text-green-600 bg-green-50';
      case 'below': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'above': return '↗️';
      case 'below': return '↘️';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading funnel analysis: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Funnel Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Sales Funnel Analysis</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Total Leads: {funnelData[0]?.value || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Conversion Rate: {calculateConversionRate(funnelData[funnelData.length - 1]?.value, funnelData[0]?.value)}%</span>
            </div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip 
                formatter={(value, name) => [value.toLocaleString(), 'Count']}
                labelFormatter={(label) => `Stage: ${label}`}
              />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {funnelData.map((stage, index) => (
            <div key={index} className="text-center p-3 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stage.value.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mb-2">{stage.stage}</div>
              {index > 0 && (
                <div className="text-xs text-red-600">
                  -{stage.dropoff}% drop
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Rate Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Rate Analysis</h3>
        
        <div className="space-y-4">
          {Object.entries(conversionRates).map(([transition, data]) => (
            <div key={transition} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{transition}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(data.status)}`}>
                  {getStatusIcon(data.status)} {data.status === 'above' ? 'Above' : data.status === 'below' ? 'Below' : 'At'} Benchmark
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-sm text-gray-600">Actual Rate</div>
                    <div className="text-xl font-bold text-gray-900">{data.rate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Benchmark</div>
                    <div className="text-xl font-bold text-gray-600">{data.benchmark}%</div>
                  </div>
                </div>
                
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${data.status === 'above' ? 'bg-green-500' : data.status === 'below' ? 'bg-red-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min(data.rate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {data.rate > data.benchmark ? '+' : ''}{data.rate - data.benchmark}% vs benchmark
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottleneck Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified Bottlenecks</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
              <div>
                <p className="font-medium text-gray-900">Demo to Proposal Stage</p>
                <p className="text-sm text-gray-600">33% drop-off rate - highest in funnel</p>
                <p className="text-xs text-gray-500 mt-1">Recommend: Improve demo quality and follow-up process</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1"></div>
              <div>
                <p className="font-medium text-gray-900">Negotiation to Close</p>
                <p className="text-sm text-gray-600">43% drop-off rate - needs attention</p>
                <p className="text-xs text-gray-500 mt-1">Recommend: Enhanced negotiation training</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
              <div>
                <p className="font-medium text-gray-900">Lead Qualification</p>
                <p className="text-sm text-gray-600">Strong performance - 70% conversion</p>
                <p className="text-xs text-gray-500 mt-1">Maintain current qualification criteria</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Opportunities</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">Quick Win</p>
              <p className="text-sm text-blue-700">Improve demo conversion by 5%</p>
              <p className="text-xs text-blue-600 mt-1">Potential: +21 additional closes per month</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900">Medium Impact</p>
              <p className="text-sm text-green-700">Enhance negotiation close rate by 8%</p>
              <p className="text-xs text-green-600 mt-1">Potential: +23 additional closes per month</p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="font-medium text-purple-900">Long Term</p>
              <p className="text-sm text-purple-700">Optimize entire funnel efficiency</p>
              <p className="text-xs text-purple-600 mt-1">Potential: +15% overall conversion improvement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunnelAnalysis;