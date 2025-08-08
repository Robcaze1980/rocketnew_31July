import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/AppIcon';
import managerService from '../../../utils/managerService';

const ManagerDashboardOverview = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    pendingSales: 0,
    completedSales: 0,
    teamAlerts: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null); // null = current month

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // Fetch team alerts and recent activities
        const [teamAlerts, recentActivities] = await Promise.all([
          managerService?.getTeamAlerts(user?.id, dateRange),
          managerService?.getRecentTeamActivities(user?.id, dateRange)
        ]);

        setDashboardData({
          pendingSales: 0, // This would need to be implemented separately
          completedSales: 0, // This would need to be implemented separately
          teamAlerts: teamAlerts || [],
          recentActivities: recentActivities || []
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to empty data on error
        setDashboardData({
          pendingSales: 0,
          completedSales: 0,
          teamAlerts: [],
          recentActivities: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id, dateRange]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border animate-pulse">
          <div className="h-6 bg-muted rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded"></div>
            ))}
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border animate-pulse">
          <div className="h-6 bg-muted rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'milestone': return 'Trophy';
      case 'attention': return 'AlertCircle';
      case 'achievement': return 'CheckCircle';
      default: return 'Bell';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'milestone': return 'text-amber-600 bg-amber-50';
      case 'attention': return 'text-red-600 bg-red-50';
      case 'achievement': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Team Alerts */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-semibold text-foreground">Team Alerts</h3>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setDateRange(null)}
                className={`px-3 py-1 text-sm rounded-md ${
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
                className={`px-3 py-1 text-sm rounded-md ${
                  dateRange ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Last 3 Months
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{dashboardData.teamAlerts.length} active</span>
              <Icon name="Bell" size={16} className="text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {dashboardData.teamAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
              <div className={`p-2 rounded-full ${getAlertColor(alert.type)}`}>
                <Icon name={getAlertIcon(alert.type)} size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Recent Team Activities</h3>
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {dashboardData.recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="User" size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.salesperson}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{activity.amount}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardOverview;
