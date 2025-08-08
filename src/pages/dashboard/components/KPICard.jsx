import React from 'react';
import AppIcon from '../../../components/AppIcon';

const KPICard = ({ title, value, change, changeType, icon, iconColor, loading = false }) => {
  // Add defensive checks for props
  const safeTitle = title || 'N/A';
  const safeValue = value || '0';
  const safeChange = change || '';
  const safeChangeType = changeType || 'neutral';
  const safeIcon = icon || 'HelpCircle';

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-8 bg-muted rounded animate-pulse w-24" />
            <div className="h-3 bg-muted rounded animate-pulse w-16" />
          </div>
          <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  const changeColor = safeChangeType === 'positive' ? 'text-success'
    : safeChangeType === 'negative' ? 'text-destructive' : 'text-muted-foreground';

  const changeIcon = safeChangeType === 'positive' ? 'TrendingUp'
    : safeChangeType === 'negative' ? 'TrendingDown' : 'Minus';

  // Default icon color if not provided
  const defaultIconColor = iconColor || 'bg-primary';

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft hover:shadow-elevated transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {safeTitle}
          </p>
          <p className="text-2xl font-semibold text-foreground mb-2">
            {safeValue}
          </p>

          {safeChange && (
            <div className={`flex items-center space-x-1 ${changeColor}`}>
              <AppIcon
                name={changeIcon}
                className="h-3 w-3"
              />
              <span className="text-sm font-medium">
                {safeChange}
              </span>
              <span className="text-xs text-muted-foreground">
                vs last month
              </span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-full ${defaultIconColor}`}>
          <AppIcon
            name={safeIcon}
            className="h-6 w-6 text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(KPICard);