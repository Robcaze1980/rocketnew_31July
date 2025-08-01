import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Add New Sale',
      description: 'Record a new vehicle sale',
      icon: 'Plus',
      variant: 'default',
      onClick: () => navigate('/add-new-sale')
    },
    {
      label: 'View Profile',
      description: 'Manage your account settings',
      icon: 'User',
      variant: 'outline',
      onClick: () => navigate('/user-profile')
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions?.map((action, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-smooth">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground">{action?.label}</h4>
              <p className="text-xs text-muted-foreground mt-1">{action?.description}</p>
            </div>
            <Button
              variant={action?.variant}
              size="sm"
              iconName={action?.icon}
              onClick={action?.onClick}
            >
              {action?.label}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(QuickActions);
