import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Icon from '../../../components/AppIcon';

const CommissionBreakdown = ({ data, comparisonData, isComparison }) => {
  const COLORS = {
    car_sales: '#3b82f6',
    warranties: '#10b981',
    maintenance: '#f59e0b',
    accessories: '#8b5cf6',
    spiff: '#ef4444'
  };

  const commissionSources = [
    { key: 'car_sales', label: 'Car Sales', icon: 'Car' },
    { key: 'warranties', label: 'Warranties', icon: 'Shield' },
    { key: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
    { key: 'accessories', label: 'Accessories', icon: 'Package' },
    { key: 'spiff', label: 'SPIFF Bonuses', icon: 'Award' }
  ];

  const pieData = commissionSources.map(source => ({
    name: source.label,
    value: data?.breakdown?.[source.key] || 0,
    color: COLORS[source.key]
  })).filter(item => item.value > 0);

  const barData = commissionSources.map(source => ({
    name: source.label,
    current: data?.breakdown?.[source.key] || 0,
    previous: comparisonData?.breakdown?.[source.key] || 0,
    color: COLORS[source.key]
  }));

  const totalCommission = pieData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'current' ? 'Current' : 'Previous'}: ${entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Commission Breakdown</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">${totalCommission.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Commission</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <h4 className="text-md font-medium text-foreground mb-4">Distribution</h4>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Icon name="PieChart" size={48} className="mx-auto mb-2 opacity-50" />
                <p>No commission data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Breakdown */}
        <div>
          <h4 className="text-md font-medium text-foreground mb-4">Detailed Breakdown</h4>
          <div className="space-y-3">
            {commissionSources.map(source => {
              const currentValue = data?.breakdown?.[source.key] || 0;
              const previousValue = comparisonData?.breakdown?.[source.key] || 0;
              const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
              
              return (
                <div key={source.key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[source.key] }}
                    />
                    <div className="flex items-center space-x-2">
                      <Icon name={source.icon} size={16} className="text-muted-foreground" />
                      <span className="font-medium text-foreground">{source.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-foreground">
                      ${currentValue.toLocaleString()}
                    </span>
                    {isComparison && previousValue > 0 && (
                      <div className={`flex items-center space-x-1 text-xs ${
                        change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        <Icon 
                          name={change > 0 ? 'TrendingUp' : change < 0 ? 'TrendingDown' : 'Minus'} 
                          size={12} 
                        />
                        <span>{Math.abs(change).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparison Bar Chart */}
      {isComparison && comparisonData && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-md font-medium text-foreground mb-4">Period Comparison</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="name" 
                stroke="rgb(156, 163, 175)"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="rgb(156, 163, 175)"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="current" 
                fill="#3b82f6" 
                name="Current Period"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="previous" 
                fill="#94a3b8" 
                name="Previous Period"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CommissionBreakdown;