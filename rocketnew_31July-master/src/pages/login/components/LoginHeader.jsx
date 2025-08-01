import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-soft">
          <Icon name="Car" size={28} color="white" />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-semibold text-foreground">AutoSales</h1>
          <p className="text-sm text-muted-foreground">Commission Dashboard</p>
        </div>
      </div>
      
      {/* Welcome Text */}
      <div className="space-y-2">
        <h2 className="text-xl font-medium text-foreground">Welcome Back</h2>
        <p className="text-muted-foreground">
          Sign in to access your sales commission dashboard
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;