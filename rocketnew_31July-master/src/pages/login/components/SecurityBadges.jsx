import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityBadges = () => {
  const securityFeatures = [
    {
      icon: 'Shield',
      text: 'SSL Encrypted'
    },
    {
      icon: 'Lock',
      text: 'Secure Login'
    },
    {
      icon: 'Database',
      text: 'Data Protected'
    }
  ];

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center justify-center space-x-6">
        {securityFeatures.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Icon 
              name={feature.icon} 
              size={16} 
              className="text-success" 
            />
            <span className="text-xs text-muted-foreground">
              {feature.text}
            </span>
          </div>
        ))}
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-4">
        Your financial data is protected with enterprise-grade security
      </p>
    </div>
  );
};

export default SecurityBadges;