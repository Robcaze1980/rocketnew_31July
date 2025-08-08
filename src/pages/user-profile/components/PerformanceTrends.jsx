import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PerformanceTrends = ({ trendsData, loading }) => {
  const [activeChart, setActiveChart] = useState('commission');

  const chartTypes = [
    { id: 'commission', label: 'Commission Trends', icon: 'DollarSign' },
    { id: 'sales', label: 'Sales Volume', icon: 'Car' },
    { id: 'deals', label: 'Average Deal Size', icon: 'Calculator' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-foreground">
                {entry.dataKey === 'commission' && '$'}
                {entry.value?.toLocaleString()}
                {entry.dataKey === 'avgDealSize' && entry.value > 0 && entry.value < 100 ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!trendsData || trendsData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Icon name="TrendingUp" size={48} className="mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Trends Data</h4>
            <p>Complete more sales to see your performance trends.</p>
          </div>
        </div>
      );
    }

    switch (activeChart) {
      case 'commission':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="period" 
                stroke="rgb(156, 163, 175)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgb(156, 163, 175)"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="commission"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#commissionGradient)"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'sales':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="period" 
                stroke="rgb(156, 163, 175)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgb(156, 163, 175)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="salesVolume"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'deals':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="period" 
                stroke="rgb(156, 163, 175)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgb(156, 163, 175)"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="avgDealSize"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance Trends</h3>
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          {chartTypes.map((chart) => (
            <Button
              key={chart.id}
              variant={activeChart === chart.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveChart(chart.id)}
              className="text-xs"
            >
              <Icon name={chart.icon} size={14} className="mr-1" />
              {chart.label}
            </Button>
          ))}
        </div>
      </div>

      {renderChart()}

      {/* Trend Summary */}
      {trendsData && trendsData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {activeChart === 'commission' && '$'}
                {trendsData[trendsData.length - 1]?.[
                  activeChart === 'commission' ? 'commission' : 
                  activeChart === 'sales' ? 'salesVolume' : 'avgDealSize'
                ]?.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Current Period</p>
            </div>
            <div className="text-center">
              {(() => {
                const current = trendsData[trendsData.length - 1]?.[
                  activeChart === 'commission' ? 'commission' : 
                  activeChart === 'sales' ? 'salesVolume' : 'avgDealSize'
                ] || 0;
                const previous = trendsData[trendsData.length - 2]?.[
                  activeChart === 'commission' ? 'commission' : 
                  activeChart === 'sales' ? 'salesVolume' : 'avgDealSize'
                ] || 0;
                const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
                
                return (
                  <>
                    <p className={`text-2xl font-bold ${
                      change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      <Icon 
                        name={change > 0 ? 'TrendingUp' : change < 0 ? 'TrendingDown' : 'Minus'} 
                        size={20} 
                        className="inline mr-1" 
                      />
                      {Math.abs(change).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">vs Previous</p>
                  </>
                );
              })()}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {activeChart === 'commission' && '$'}
                {(trendsData.reduce((sum, item) => sum + (item[
                  activeChart === 'commission' ? 'commission' : 
                  activeChart === 'sales' ? 'salesVolume' : 'avgDealSize'
                ] || 0), 0) / trendsData.length).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Average</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceTrends;