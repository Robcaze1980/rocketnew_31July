import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PersonalInfoForm from './components/PersonalInfoForm';
import ProfilePhotoUpload from './components/ProfilePhotoUpload';
import SecuritySettings from './components/SecuritySettings';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const tabs = [
    {
      id: 'profile',
      label: 'Profile Information',
      icon: 'User',
      description: 'Manage your personal details and contact information'
    },
    {
      id: 'security',
      label: 'Security',
      icon: 'Shield',
      description: 'Manage password and security settings'
    }
  ];

  useEffect(() => {
    document.title = 'User Profile - Auto Sales Commission Dashboard';
  }, []);

  const handleProfileSave = async (updatedData) => {
    if (!user?.id) return;

    setIsUpdating(true);
    try {
      const result = await updateProfile(updatedData);
      
      if (result.success) {
        alert('Profile updated successfully!');
      } else {
        alert(`Failed to update profile: ${result.error}`);
      }
    } catch (error) {
      alert('Error updating profile. Please try again.');
      console.log('Profile update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoChange = async (photoUrl) => {
    if (!user?.id) return;

    setIsUpdating(true);
    try {
      const result = await updateProfile({
        profile_photo_url: photoUrl
      });
      
      if (!result.success) {
        alert(`Failed to update photo: ${result.error}`);
      }
    } catch (error) {
      alert('Error updating photo. Please try again.');
      console.log('Photo update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-lg shadow-soft p-6">
                <div className="flex items-center space-x-6">
                  <ProfilePhotoUpload 
                    currentPhoto={userProfile?.profile_photo_url}
                    onPhotoChange={handlePhotoChange}
                    userId={user?.id}
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {userProfile?.full_name || 'User Name'}
                    </h2>
                    <p className="text-muted-foreground capitalize">
                      {userProfile?.role || 'Member'} • Sales Representative
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Employee ID: {userProfile?.employee_id || 'Not Set'}
                    </p>
                  </div>
                </div>
              </div>

              <PersonalInfoForm 
                profileData={userProfile}
                onSave={handleProfileSave}
                isUpdating={isUpdating}
              />
              <SecuritySettings />
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="bg-card border border-border rounded-lg p-6 shadow-soft">
            <SecuritySettings />
          </div>
        );
      
      default:
        return null;
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-foreground">User Profile</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your account settings and view your performance
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {userProfile?.full_name || 'User Name'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userProfile?.employee_id || 'No ID'} • {userProfile?.role || 'member'}
                  </p>
                </div>
                
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-card shadow-soft">
                  {userProfile?.profile_photo_url ? (
                    <img
                      src={userProfile.profile_photo_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/images/no_image.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="User" size={24} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-border">
              <nav className="flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-smooth ${
                      activeTab === tab.id
                        ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                    }`}
                  >
                    <Icon name={tab.icon} size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Tab Description */}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {renderTabContent()}
          </div>

          {/* Quick Actions */}
          <div className="bg-muted/30 border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                iconName="BarChart3"
                iconPosition="left"
                onClick={() => navigate('/dashboard')}
              >
                View Dashboard
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                iconName="Plus"
                iconPosition="left"
                onClick={() => navigate('/add-new-sale')}
              >
                Add New Sale
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                iconName="HelpCircle"
                iconPosition="left"
                onClick={() => window.open('/help', '_blank')}
              >
                Get Help
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
