import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import Icon from '../AppIcon';
import { Button } from './Button';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const { canAccessManagerFeatures } = useRoleAccess();

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Add Sale', path: '/add-new-sale', icon: 'Plus' },
    { label: 'Sales Grid', path: '/sales-grid', icon: 'Grid3X3' },
    { label: 'Profile', path: '/user-profile', icon: 'User' },
  ]?.filter(item => item && item?.label && item?.path && item?.icon);

  const managerNavigationItems = [
    { label: 'Manager Dashboard', path: '/manager-dashboard', icon: 'BarChart3' },
    { label: 'Team Reports', path: '/team-reports', icon: 'FileText' },
    { label: 'Department KPIs', path: '/department-kpis', icon: 'TrendingUp' },
    { label: 'Performance Analytics', path: '/performance-analytics', icon: 'PieChart' },
  ]?.filter(item => item && item?.label && item?.path && item?.icon);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActivePath = (path) => location.pathname === path;

  const Logo = () => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <Icon name="Car" size={20} color="white" />
      </div>
      {!isCollapsed && (
        <span className="text-xl font-semibold text-foreground">AutoSales</span>
      )}
    </div>
  );

  return (
    <div className={`fixed left-0 top-0 h-screen bg-card border-r border-border shadow-soft transition-all duration-300 z-40 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8"
            >
              <Icon name={isCollapsed ? "ChevronRight" : "ChevronLeft"} size={16} />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Regular Navigation */}
          <div className="mb-6">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Sales Tools
              </h3>
            )}
            <ul className="space-y-2">
              {navigationItems?.map((item) => (
                <li key={item?.path}>
                  <button
                    onClick={() => handleNavigation(item?.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                      isActivePath(item?.path)
                        ? 'text-primary bg-primary/10 border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title={isCollapsed ? item?.label : ''}
                  >
                    <Icon name={item?.icon} size={16} className="flex-shrink-0" />
                    {!isCollapsed && <span>{item?.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Manager Navigation Section */}
          {canAccessManagerFeatures && (
            <div className="mb-6">
              {!isCollapsed && (
                <div className="flex items-center space-x-2 mb-3 px-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Management
                  </h3>
                  <div className="h-px bg-border flex-1"></div>
                  <div className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                    {userProfile?.role === 'admin' ? 'ADMIN' : 'MANAGER'}
                  </div>
                </div>
              )}
              <ul className="space-y-2">
                {managerNavigationItems?.map((item) => (
                  <li key={item?.path}>
                    <button
                      onClick={() => handleNavigation(item?.path)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                        isActivePath(item?.path)
                          ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title={isCollapsed ? item?.label : ''}
                    >
                      <Icon name={item?.icon} size={16} className="flex-shrink-0" />
                      {!isCollapsed && <span>{item?.label}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-border">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-smooth"
              title={isCollapsed ? userProfile?.full_name || user?.email : ''}
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="User" size={16} color="white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userProfile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || ''}
                  </p>
                  {userProfile?.role && userProfile?.role !== 'member' && (
                    <p className="text-xs text-amber-600 font-medium uppercase">
                      {userProfile?.role}
                    </p>
                  )}
                </div>
              )}
              {!isCollapsed && (
                <Icon name="ChevronUp" size={16} className="text-muted-foreground flex-shrink-0" />
              )}
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className={`absolute bottom-full mb-2 ${isCollapsed ? 'left-16' : 'left-0 right-0'} bg-popover border border-border rounded-md shadow-elevated z-50`}>
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/user-profile');
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-smooth"
                  >
                    <Icon name="Settings" size={16} />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-smooth"
                  >
                    <Icon name="LogOut" size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;