import React, { useState, useEffect } from 'react';
import { Bar } from 'recharts';


import { useAuth } from '../../../contexts/AuthContext';
import managerService from '../../../utils/managerService';

export default function AdvancedAnalytics() {
  const { user } = useAuth();
  const [goalProgress, setGoalProgress] = useState({
    revenue: { current: 0, target: 0, percentage: 0 },
    sales: { current: 0, target: 0, percentage: 0 },
    commissions: { current: 0, target: 0, percentage: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // Phase 2: Load real goal progress data
  useEffect(() => {
    let isMounted = true;

    const loadGoalProgress = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Verify manager access
        await managerService?.verifyManagerAccess(user?.id);

        // Fetch real goal progress data
        const data = await managerService?.getGoalProgress(user?.id, dateRange);

        if (isMounted) {
          setGoalProgress(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load goal progress');
          console.error('Goal progress loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGoalProgress();

    return () => {
      isMounted = false;
    };
  }, [user?.id, dateRange]);

  // Phase 3: Real-time updates for goal progress
  useEffect(() => {
    let channel = null;

    if (user?.id) {
      channel = managerService?.subscribeToTeamUpdates(user?.id, () => {
        // Reload goal progress when team sales are updated
        managerService?.getGoalProgress(user?.id, dateRange)?.then(data => setGoalProgress(data))?.catch(err => console.error('Real-time goal progress update error:', err));
      });
    }

    return () => {
      if (channel) {
        managerService?.unsubscribeChannel(channel);
      }
    };
  }, [user?.id, dateRange]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)]?.map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading goal progress: {error}</p>
        <button
          onClick={() => window.location?.reload()}
          className="text-red-600 underline text-sm mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const goals = [
    {
      title: 'Revenue Goal',
      current: goalProgress?.revenue?.current,
      target: goalProgress?.revenue?.target,
      percentage: goalProgress?.revenue?.percentage,
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      progressColor: 'bg-green-500'
    },
    {
      title: 'Sales Goal',
      current: goalProgress?.sales?.current,
      target: goalProgress?.sales?.target,
      percentage: goalProgress?.sales?.percentage,
      icon: '🎯',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      progressColor: 'bg-blue-500'
    },
    {
      title: 'Commission Goal',
      current: goalProgress?.commissions?.current,
      target: goalProgress?.commissions?.target,
      percentage: goalProgress?.commissions?.percentage,
      icon: '📈',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      progressColor: 'bg-purple-500'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Goal Progress</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange(null)}
            className={`px-3 py-2 text-sm rounded-md ${
              !dateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
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
              dateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>
      <div className="space-y-6">
        {goals?.map((goal, index) => (
          <div key={index} className={`${goal?.bgColor} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{goal?.icon}</span>
                <div>
                  <h4 className={`font-medium ${goal?.color}`}>{goal?.title}</h4>
                  <p className="text-sm text-gray-600">
                    {goal?.title?.includes('Revenue') || goal?.title?.includes('Commission')
                      ? `$${Math.round(goal?.current)?.toLocaleString()} / $${Math.round(goal?.target)?.toLocaleString()}`
                      : `${goal?.current} / ${goal?.target}`
                    }
                  </p>
                </div>
              </div>
              <div className={`text-right ${goal?.color}`}>
                <p className="text-2xl font-bold">
                  {Math.round(goal?.percentage)}%
                </p>
                <p className="text-sm opacity-75">Complete</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${goal?.progressColor}`}
                style={{ width: `${Math.min(goal?.percentage, 100)}%` }}
              ></div>
            </div>

            {/* Status Message */}
            <div className="mt-2 text-sm text-gray-600">
              {goal?.percentage >= 100 ? (
                <span className="text-green-600 font-medium">🎉 Goal achieved!</span>
              ) : goal?.percentage >= 75 ? (
                <span className="text-blue-600 font-medium">🔥 Almost there!</span>
              ) : goal?.percentage >= 50 ? (
                <span className="text-yellow-600 font-medium">📊 Good progress</span>
              ) : (
                <span className="text-orange-600 font-medium">🚀 Keep pushing!</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
