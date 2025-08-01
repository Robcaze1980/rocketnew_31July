import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const GoalTracking = ({ goalsData, onUpdateGoal }) => {
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalValue, setGoalValue] = useState('');

  const defaultGoals = [
    {
      id: 'monthly_commission',
      label: 'Monthly Commission',
      icon: 'DollarSign',
      unit: '$',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      target: 8000,
      current: goalsData?.monthlyCommission || 0
    },
    {
      id: 'monthly_sales',
      label: 'Monthly Sales',
      icon: 'Car',
      unit: '',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      target: 12,
      current: goalsData?.monthlySales || 0
    },
    {
      id: 'conversion_rate',
      label: 'Conversion Rate',
      icon: 'TrendingUp',
      unit: '%',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      target: 75,
      current: goalsData?.conversionRate || 0
    },
    {
      id: 'customer_satisfaction',
      label: 'Customer Satisfaction',
      icon: 'Star',
      unit: '/5',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      target: 4.5,
      current: goalsData?.customerSatisfaction || 0
    }
  ];

  const handleEditGoal = (goal) => {
    setEditingGoal(goal.id);
    setGoalValue(goal.target.toString());
  };

  const handleSaveGoal = (goalId) => {
    const numericValue = parseFloat(goalValue);
    if (!isNaN(numericValue) && numericValue > 0) {
      onUpdateGoal?.(goalId, numericValue);
      setEditingGoal(null);
      setGoalValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setGoalValue('');
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-success';
    if (percentage >= 75) return 'bg-warning';
    if (percentage >= 50) return 'bg-primary';
    return 'bg-destructive';
  };

  const getAchievementBadge = (percentage) => {
    if (percentage >= 150) return { icon: 'Crown', label: 'Superstar', color: 'text-yellow-500' };
    if (percentage >= 120) return { icon: 'Trophy', label: 'Exceptional', color: 'text-orange-500' };
    if (percentage >= 100) return { icon: 'Award', label: 'Goal Met', color: 'text-green-500' };
    if (percentage >= 75) return { icon: 'Target', label: 'On Track', color: 'text-blue-500' };
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Goal Tracking</h3>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Performance Period</p>
          <p className="font-medium text-foreground">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {defaultGoals.map((goal) => {
          const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
          const achievement = getAchievementBadge(percentage);
          const isEditing = editingGoal === goal.id;

          return (
            <div key={goal.id} className="bg-muted/30 border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${goal.bgColor}`}>
                    <Icon name={goal.icon} size={20} className={goal.color} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{goal.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {goal.current}{goal.unit} / {goal.target}{goal.unit}
                    </p>
                  </div>
                </div>
                
                {achievement && (
                  <div className="flex items-center space-x-2">
                    <Icon name={achievement.icon} size={16} className={achievement.color} />
                    <span className={`text-xs font-medium ${achievement.color}`}>
                      {achievement.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium text-foreground">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>

              {/* Goal Management */}
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-sm text-muted-foreground">Target:</span>
                    <input
                      type="number"
                      value={goalValue}
                      onChange={(e) => setGoalValue(e.target.value)}
                      className="px-2 py-1 border border-border rounded text-sm w-20 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Goal"
                      step={goal.id === 'customer_satisfaction' ? '0.1' : '1'}
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">{goal.unit}</span>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        onClick={() => handleSaveGoal(goal.id)}
                        className="h-6 px-2 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-6 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Remaining: </span>
                      <span className="font-medium text-foreground">
                        {Math.max(0, goal.target - goal.current)}{goal.unit}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditGoal(goal)}
                      className="h-6 px-2 text-xs"
                    >
                      <Icon name="Edit2" size={12} className="mr-1" />
                      Edit Goal
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Progress Summary */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {defaultGoals.filter(g => (g.current / g.target) * 100 >= 100).length}
            </p>
            <p className="text-sm text-muted-foreground">Goals Achieved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {(defaultGoals.reduce((sum, g) => sum + Math.min(100, (g.current / g.target) * 100), 0) / defaultGoals.length).toFixed(0)}%
            </p>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {defaultGoals.filter(g => (g.current / g.target) * 100 >= 75).length}
            </p>
            <p className="text-sm text-muted-foreground">On Track</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {defaultGoals.filter(g => (g.current / g.target) * 100 >= 150).length}
            </p>
            <p className="text-sm text-muted-foreground">Exceeded Goals</p>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center space-x-3">
          <Icon name="Target" size={20} className="text-primary" />
          <div>
            <h4 className="font-medium text-foreground">Keep Up the Great Work!</h4>
            <p className="text-sm text-muted-foreground">
              You're making excellent progress. Stay focused on your goals and continue delivering outstanding results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalTracking;