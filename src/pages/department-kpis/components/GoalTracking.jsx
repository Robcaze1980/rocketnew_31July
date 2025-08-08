import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import managerService from '../../../utils/managerService';
import { Target, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

const GoalTracking = ({ dateRange, expanded = false }) => {
  const { user } = useAuth();
  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadGoalData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const data = await managerService?.getGoalProgress(user?.id, dateRange);
        
        if (isMounted) {
          setGoalData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load goal tracking data');
          console.error('Goal tracking loading error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGoalData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, dateRange]);

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressBgColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-50';
    if (percentage >= 75) return 'bg-blue-50';
    if (percentage >= 50) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 100) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Target className="h-5 w-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)]?.map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <p className="text-red-800">Error loading goal tracking: {error}</p>
        </div>
      </div>
    );
  }

  if (!goalData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No goal data available</p>
        </div>
      </div>
    );
  }

  const goals = [
    {
      title: 'Revenue Goal',
      current: goalData?.revenue?.current || 0,
      target: goalData?.revenue?.target || 0,
      percentage: goalData?.revenue?.percentage || 0,
      icon: '💰',
      type: 'currency'
    },
    {
      title: 'Sales Goal',
      current: goalData?.sales?.current || 0,
      target: goalData?.sales?.target || 0,
      percentage: goalData?.sales?.percentage || 0,
      icon: '🎯',
      type: 'number'
    },
    {
      title: 'Commission Goal',
      current: goalData?.commissions?.current || 0,
      target: goalData?.commissions?.target || 0,
      percentage: goalData?.commissions?.percentage || 0,
      icon: '📈',
      type: 'currency'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Goal Tracking</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Current Period</span>
        </div>
      </div>
      <div className={`grid ${expanded ? 'grid-cols-1 gap-6' : 'grid-cols-1 gap-4'}`}>
        {goals?.map((goal, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getProgressBgColor(goal?.percentage)} border-gray-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{goal?.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{goal?.title}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>
                      {goal?.type === 'currency' ? '$' : ''}{Math.round(goal?.current)?.toLocaleString()}
                    </span>
                    <span>/</span>
                    <span>
                      {goal?.type === 'currency' ? '$' : ''}{Math.round(goal?.target)?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(goal?.percentage)}
                <span className="text-lg font-bold text-gray-900">
                  {Math.round(goal?.percentage)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full ${getProgressColor(goal?.percentage)} transition-all duration-300`}
                style={{ width: `${Math.min(goal?.percentage, 100)}%` }}
              ></div>
            </div>

            {expanded && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Remaining:</span>
                    <span className="ml-2 font-medium">
                      {goal?.type === 'currency' ? '$' : ''}{Math.max(0, goal?.target - goal?.current)?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${
                      goal?.percentage >= 100 ? 'text-green-600' : 
                      goal?.percentage >= 75 ? 'text-blue-600' : 
                      goal?.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {goal?.percentage >= 100 ? 'Achieved' : 
                       goal?.percentage >= 75 ? 'On Track' : 
                       goal?.percentage >= 50 ? 'Behind' : 'Needs Attention'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {!expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium text-gray-900">
                {Math.round(goals?.reduce((sum, goal) => sum + goal?.percentage, 0) / goals?.length)}% Avg
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTracking;