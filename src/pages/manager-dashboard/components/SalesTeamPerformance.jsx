import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import managerService from '../../../utils/managerService';

export default function SalesTeamPerformance() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null); // null = current month

  useEffect(() => {
    let isMounted = true;

    const loadTeamData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Verify manager access
        await managerService?.verifyManagerAccess(user?.id);

        // Fetch real team members data with date range
        const members = await managerService?.getTeamMembers(user?.id, dateRange);

        if (isMounted) {
          // Sort team members by total sales (descending)
          const sortedMembers = [...(members || [])]?.sort((a, b) => 
            (b?.total_sales || 0) - (a?.total_sales || 0)
          );
          // Take only the top 6 performers
          setTeamMembers(sortedMembers?.slice(0, 6) || []);
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
  }, [user?.id, dateRange]);

  // Real-time updates for team member data
  useEffect(() => {
    let channel = null;

    if (user?.id) {
      channel = managerService?.subscribeToTeamUpdates(user?.id, () => {
        // Reload team data when changes occur
        managerService?.getTeamMembers(user?.id, dateRange)?.then(members => {
          // Sort team members by total sales (descending)
          const sortedMembers = [...(members || [])]?.sort((a, b) => 
            (b?.total_sales || 0) - (a?.total_sales || 0)
          );
          // Take only the top 6 performers
          setTeamMembers(sortedMembers?.slice(0, 6) || []);
        })?.catch(err => console.error('Real-time team update error:', err));
      });
    }

    return () => {
      if (channel) {
        managerService?.unsubscribeChannel(channel);
      }
    };
  }, [user?.id, dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Team Performance</h3>
        <div className="space-y-4">
          {[...Array(6)]?.map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Team Performance</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading team performance: {error}</p>
          <button
            onClick={() => window.location?.reload()}
            className="text-red-600 underline text-sm mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Sales Team Performance</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange(null)}
            className={`px-3 py-2 text-sm rounded-md ${
              !dateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
              const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              setDateRange({
                startDate: startDate?.toISOString()?.split('T')?.[0],
                endDate: endDate?.toISOString()?.split('T')?.[0]
              });
            }}
            className={`px-3 py-2 text-sm rounded-md ${
              dateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>
      
      {/* Mini-cards for salespeople */}
      <div className="space-y-4">
        {teamMembers?.map((member, index) => (
          <div key={member?.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-800 font-medium text-sm">
                  {getInitials(member?.full_name)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{member?.full_name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{member?.role || 'Sales Rep'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900 text-sm">
                {member?.total_sales || 0} {member?.total_sales === 1 ? 'unit' : 'units'}
              </p>
              <p className="text-xs text-green-600">
                {formatCurrency(member?.total_revenue || 0)}
              </p>
              <p className="text-xs text-blue-600">
                {formatCurrency(member?.total_commission || 0)} profit
              </p>
            </div>
          </div>
        ))}
        
        {teamMembers?.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No team members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
