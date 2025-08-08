import React from 'react';
import AppImage from '../../../components/AppImage';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <AppImage 
          src="/assets/images/easy BOIR.png" 
          alt="Easy BOIR Logo" 
          className="h-32 object-contain"
        />
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
