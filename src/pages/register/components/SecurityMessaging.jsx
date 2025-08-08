import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityMessaging = () => {
  const securityFeatures = [
    {
      icon: 'Shield',
      title: 'Data Protection',
      description: 'Your commission data is encrypted and secure'
    },
    {
      icon: 'Lock',
      title: 'Secure Access',
      description: 'Multi-factor authentication available'
    },
    {
      icon: 'Eye',
      title: 'Privacy First',
      description: 'Your information is never shared with third parties'
    }
  ];

  return (
    <div className="bg-muted/50 rounded-lg p-6 mt-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="ShieldCheck" size={20} className="text-success" />
        <h4 className="font-semibold text-foreground">Security & Privacy</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {securityFeatures.map((feature, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name={feature.icon} size={14} className="text-success" />
            </div>
            <div>
              <h5 className="text-sm font-medium text-foreground mb-1">{feature.title}</h5>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityMessaging;