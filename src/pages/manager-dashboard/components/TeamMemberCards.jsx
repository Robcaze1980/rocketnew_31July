import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import managerService from '../../../utils/managerService';

export default function TeamMemberCards() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null); // null = current month

  // Phase 3: Load real team member data
  useEffect(() => {
    let isMounted = true;

    const loadTeamData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Verify manager access
        await managerService?.verifyManagerAccess(user?.id);

        // Fetch real team members and their performance data
        const [members, performance] = await Promise.all([
          managerService?.getTeamMembers(user?.id),
          managerService?.getTeamPerformanceData(user?.id)
        ]);

        if (isMounted) {
          setTeamMembers(members);
          setPerformanceData(performance);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load team data');
          console.error('Team data loading error:', err);
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
  }, [user?.id]);

  // Phase 3: Real-time updates for team member data
  useEffect(() => {
    let channel = null;

    if (user?.id) {
      channel = managerService?.subscribeToTeamUpdates(user?.id, () => {
        // Reload team data when changes occur
        Promise.all([
          managerService?.getTeamMembers(user?.id),
          managerService?.getTeamPerformanceData(user?.id)
        ])?.then(([members, performance]) => {
          setTeamMembers(members);
          setPerformanceData(performance);
        })?.catch(err => console.error('Real-time team update error:', err));
      });
    }

    return () => {
      if (channel) {
        managerService?.unsubscribeChannel(channel);
      }
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)]?.map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading team members: {error}</p>
        <button
          onClick={() => window.location?.reload()}
          className="text-red-600 underline text-sm mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  // Merge team member info with performance data
  const enrichedTeamMembers = teamMembers?.map(member => {
    const performance = performanceData?.find(p => p?.id === member?.id) || {
      totalSales: 0,
      totalRevenue: 0,
      totalCommissions: 0,
      averageSaleValue: 0
    };

    return {
      ...member,
      ...performance
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
        <div className="text-sm text-gray-500">
          {enrichedTeamMembers?.length} active members
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedTeamMembers?.map((member) => (
          <div key={member?.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Member Header */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {member?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{member?.full_name}</h3>
                <p className="text-sm text-gray-500 capitalize">{member?.role}</p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Sales</span>
                <span className="font-medium text-gray-900">{member?.totalSales}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="font-medium text-green-600">
                  ${Math.round(member?.totalRevenue)?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Commissions</span>
                <span className="font-medium text-blue-600">
                  ${Math.round(member?.totalCommissions)?.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. Sale</span>
                <span className="font-medium text-purple-600">
                  ${Math.round(member?.averageSaleValue)?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Performance Badge */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Performance</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  member?.totalSales >= 10 ? 'bg-green-100 text-green-800' :
                  member?.totalSales >= 5 ? 'bg-yellow-100 text-yellow-800' :
                  member?.totalSales > 0 ? 'bg-blue-100 text-blue-800': 'bg-gray-100 text-gray-800'
                }`}>
                  {member?.totalSales >= 10 ? 'Excellent' :
                   member?.totalSales >= 5 ? 'Good' :
                   member?.totalSales > 0 ? 'Active': 'Getting Started'}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            {member?.email && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 truncate">{member?.email}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {enrichedTeamMembers?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">👥</div>
          <p className="text-gray-500">No team members found</p>
          <p className="text-sm text-gray-400">Team members will appear here when assigned to your management</p>
        </div>
      )}
    </div>
  );
}
