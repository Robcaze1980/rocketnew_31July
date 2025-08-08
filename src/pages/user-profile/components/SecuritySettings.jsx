import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const SecuritySettings = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const recentSessions = [
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'Springfield, IL',
      lastActive: '2 minutes ago',
      current: true,
      ip: '192.168.1.100'
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      location: 'Springfield, IL',
      lastActive: '3 hours ago',
      current: false,
      ip: '192.168.1.101'
    },
    {
      id: 3,
      device: 'Chrome on Android',
      location: 'Chicago, IL',
      lastActive: '2 days ago',
      current: false,
      ip: '10.0.0.50'
    }
  ];

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTerminateSession = (sessionId) => {
    if (window.confirm('Are you sure you want to terminate this session?')) {
      console.log('Terminating session:', sessionId);
    }
  };

  const handleTerminateAllSessions = () => {
    if (window.confirm('This will log you out of all devices except this one. Continue?')) {
      console.log('Terminating all other sessions');
    }
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Change Password</h3>
        <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              error={errors.currentPassword}
              required
            />

            <Input
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              error={errors.newPassword}
              description="Must be at least 8 characters long"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              required
            />

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                loading={isChangingPassword}
                iconName="Lock"
                iconPosition="left"
              >
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Two-Factor Authentication</h3>
        <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Icon name="Shield" size={20} className="text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'} - Add an extra layer of security
                </p>
              </div>
            </div>
            <Checkbox
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
            />
          </div>
          
          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircle" size={16} className="text-success" />
                <p className="text-sm text-success">Two-factor authentication is active</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Backup codes: 3 remaining
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h3>
        <div className="bg-card border border-border rounded-lg p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon name="Mail" size={20} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Checkbox
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon name="MessageSquare" size={20} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">SMS Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via text message</p>
              </div>
            </div>
            <Checkbox
              checked={smsNotifications}
              onChange={(e) => setSmsNotifications(e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Active Sessions</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTerminateAllSessions}
            iconName="LogOut"
            iconPosition="left"
          >
            Terminate All Others
          </Button>
        </div>
        
        <div className="bg-card border border-border rounded-lg shadow-soft divide-y divide-border">
          {recentSessions.map((session) => (
            <div key={session.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-full">
                    <Icon name="Monitor" size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-foreground">{session.device}</p>
                      {session.current && (
                        <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.location} • {session.ip}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {session.lastActive}
                    </p>
                  </div>
                </div>
                
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTerminateSession(session.id)}
                    iconName="X"
                  >
                    Terminate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;