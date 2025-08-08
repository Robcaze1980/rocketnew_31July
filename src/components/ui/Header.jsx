import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Add Sale', path: '/add-new-sale', icon: 'Plus' },
  ];

  const userMenuItems = [
    { label: 'My Profile', path: '/user-profile', icon: 'User' },
    { label: 'Settings', path: '/settings', icon: 'Settings' },
    { label: 'Help', path: '/help', icon: 'HelpCircle' },
    { label: 'Logout', action: 'logout', icon: 'LogOut' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleUserMenuAction = (item) => {
    if (item.action === 'logout') {
      localStorage.removeItem('authToken');
      navigate('/login');
    } else {
      navigate(item.path);
    }
    setIsUserMenuOpen(false);
  };

  const isActivePath = (path) => location.pathname === path;

  const Logo = () => (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <Icon name="Car" size={20} color="white" />
      </div>
      <span className="text-xl font-semibold text-foreground">AutoSales</span>
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-soft">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                  isActivePath(item.path)
                    ? 'text-primary bg-primary/10' :'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-muted transition-smooth"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="User" size={16} color="white" />
                </div>
                <Icon name="ChevronDown" size={16} className="text-muted-foreground" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-md shadow-elevated z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">John Doe</p>
                    <p className="text-xs text-muted-foreground">john.doe@dealership.com</p>
                  </div>
                  <div className="py-1">
                    {userMenuItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleUserMenuAction(item)}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-smooth"
                      >
                        <Icon name={item.icon} size={16} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-muted transition-smooth"
            >
              <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActivePath(item.path)
                      ? 'text-primary bg-primary/10' :'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;