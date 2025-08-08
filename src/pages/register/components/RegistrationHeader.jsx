import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const RegistrationHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-soft">
          <Icon name="Car" size={32} color="white" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Join AutoSales
      </h1>
      
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Create your account to start tracking sales commissions and managing your dealership performance
      </p>

      <div className="flex items-center justify-center space-x-2 text-sm">
        <span className="text-muted-foreground">Already have an account?</span>
        <button
          onClick={() => navigate('/login')}
          className="text-primary hover:text-primary/80 font-medium transition-smooth"
        >
          Sign in here
        </button>
      </div>
    </div>
  );
};

export default RegistrationHeader;