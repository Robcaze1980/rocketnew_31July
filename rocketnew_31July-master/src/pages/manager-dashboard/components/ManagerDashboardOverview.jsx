import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const ManagerDashboardOverview = () => {
  const [dashboardData, setDashboardData] = useState({
    pendingSales: 0,
    completedSales: 0,
    teamAlerts: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const timer = setTimeout(() => {
      setDashboardData({
        pendingSales: 12,
        completedSales: 127,
        teamAlerts: [
          { id: 1, type: 'milestone', message: 'John Doe reached monthly quota', time: '2 hours ago' },
          { id: 2, type: 'attention', message: 'Jane Smith needs review on large sale', time: '4 hours ago' },
          { id: 3, type: 'achievement', message: 'Team exceeded weekly target by 15%', time: '1 day ago' }
        ],
        recentActivities: [
          { id: 1, salesperson: 'John Doe', action: 'Completed sale', amount: '$32,500', time: '1 hour ago' },
          { id: 2, salesperson: 'Jane Smith', action: 'Added new sale', amount: '$28,750', time: '2 hours ago' },
          { id: 3, salesperson: 'Mike Wilson', action: 'Updated commission', amount: '$15,200', time: '3 hours ago' },
          { id: 4, salesperson: 'Sarah Brown', action: 'Completed sale', amount: '$41,300', time: '5 hours ago' }
        ]
      });
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Team Alerts</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">{dashboardData.teamAlerts.length} active</span>
            <Icon name="Bell" size={16} className="text-muted-foreground" />
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