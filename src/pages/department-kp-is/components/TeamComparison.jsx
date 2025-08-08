import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import managerService from '../../../utils/managerService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Medal, Users } from 'lucide-react';

const TeamComparison = ({ dateRange }) => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('totalRevenue');

  useEffect(() => {
    let isMounted = true;

    const loadTeamData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const data = await managerService.getTeamPerformanceData(user.id, dateRange);
        
        if (isMounted) {
          setTeamData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load team comparison data');
          console.error('Team comparison loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTeamData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, dateRange]);

  const sortedTeamData = [...teamData].sort((a, b) => {
    return b[sortBy] - a[sortBy];
  });

  const chartData = sortedTeamData.map((member, index) => ({
    name: member.name?.split(' ').map(n => n[0]).join('') || 'N/A',
    fullName: member.name,
    revenue: member.totalRevenue,
    commissions: member.totalCommissions,
    sales: member.totalSales,
    rank: index + 1
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading team comparison: {error}</p>
        </div>
      </div>
    );
  }

  const getTopPerformers = () => {
    return sortedTeamData.slice(0, 3).map((member, index) => ({
      ...member,
      rank: index + 1,
      medal: index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Team Performance Comparison</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="totalRevenue">Sort by Revenue</option>
          <option value="totalCommissions">Sort by Commissions</option>
          <option value="totalSales">Sort by Sales Count</option>
          <option value="averageSaleValue">Sort by Avg Sale Value</option>
        </select>
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue' || name === 'commissions') {
                    return [`$${value.toLocaleString()}`, name];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  const member = chartData.find(m => m.name === label);
                  return member?.fullName || label;
                }}
              />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar dataKey="commissions" fill="#3b82f6" name="Commissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Performers Section */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Medal className="h-5 w-5 text-yellow-500" />
          <h4 className="text-md font-medium text-gray-900">Top Performers</h4>
        </div>
        
        {getTopPerformers().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No team performance data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getTopPerformers().map((performer) => (
              <div
                key={performer.id}
                className={`p-4 rounded-lg border-2 ${
                  performer.rank === 1
                    ? 'border-yellow-200 bg-yellow-50'
                    : performer.rank === 2
                    ? 'border-gray-200 bg-gray-50' :'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{performer.medal}</span>
                  <span className="text-sm font-medium text-gray-600">#{performer.rank}</span>
                </div>
                <h5 className="font-semibold text-gray-900 mb-1">{performer.name}</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">${Math.round(performer.totalRevenue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales:</span>
                    <span className="font-medium">{performer.totalSales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Sale:</span>
                    <span className="font-medium">${Math.round(performer.averageSaleValue).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Rankings */}
      {sortedTeamData.length > 3 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Complete Rankings</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Member</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Sale</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTeamData.map((member, index) => (
                  <tr key={member.id} className={index < 3 ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 text-sm text-gray-900">#{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${Math.round(member.totalRevenue).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{member.totalSales}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${Math.round(member.averageSaleValue).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamComparison;