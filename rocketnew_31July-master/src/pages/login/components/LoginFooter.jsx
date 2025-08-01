import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const LoginFooter = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          New employee? Need access to the system?
        </p>
        <Button
          variant="outline"
          onClick={handleRegisterClick}
          iconName="UserPlus"
          iconPosition="left"
          fullWidth
        >
          Register Account
        </Button>
      </div>
      
      {/* Footer Links */}
      <div className="pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <p className="text-xs text-muted-foreground">
            © {currentYear} AutoSales Dashboard. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-4">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-smooth">
              Privacy Policy
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-smooth">
              Terms of Service
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-smooth">
              Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginFooter;