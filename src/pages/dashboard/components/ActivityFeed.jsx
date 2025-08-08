import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import activityService from '../../../utils/activityService';
import AppIcon from '../../../components/AppIcon';

const ActivityFeed = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        const result = await activityService?.getUserActivity(userId, 10);

        if (isMounted) {
          if (result?.success) {
            setActivities(result?.data || []);
          } else {
            setError(result?.error || 'Failed to load activities');
          }
        }
      } catch (error) {
        if (isMounted) {
          setError('Failed to load recent activities');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadActivities();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Memoize utility functions
  const getActivityIcon = useMemo(() => (action) => {
    switch (action?.toLowerCase()) {
      case 'sale created':
        return { name: 'Plus', color: 'text-success' };
      case 'sale updated':
        return { name: 'Edit', color: 'text-primary' };
      case 'profile updated':
        return { name: 'User', color: 'text-blue-500' };
      case 'login':
        return { name: 'LogIn', color: 'text-green-500' };
      default:
        return { name: 'Activity', color: 'text-muted-foreground' };
    }
  }, []);

  const formatTimeAgo = useMemo(() => (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)]?.map((_, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <AppIcon name="AlertCircle" className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (activities?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <AppIcon name="Clock" className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities?.map((activity) => {
          const iconData = getActivityIcon(activity?.action);

          return (
            <div key={activity?.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-full bg-muted/30 ${iconData?.color}`}>
                <AppIcon name={iconData?.name} className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {activity?.action}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity?.created_at)}
                  </span>
                </div>

                {activity?.details && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {activity?.details}
                  </p>
                )}

                {activity?.sale && (
                  <div className="text-xs text-primary mt-1">
                    Stock #{activity?.sale?.stock_number} - {activity?.sale?.customer_name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {activities?.length >= 10 && (
        <div className="mt-4 pt-4 border-t border-border">
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ActivityFeed);
