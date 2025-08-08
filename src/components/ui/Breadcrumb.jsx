import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const Breadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathMap = {
    '/dashboard': 'Dashboard',
    '/add-new-sale': 'Add New Sale',
    '/edit-sale': 'Edit Sale',
    '/user-profile': 'User Profile',
    '/settings': 'Settings',
    '/help': 'Help',
  };

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/dashboard' }];

    if (location.pathname !== '/dashboard') {
      const currentPath = location.pathname;
      const currentLabel = pathMap[currentPath] || 'Unknown Page';
      breadcrumbs.push({ label: currentLabel, path: currentPath });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleBreadcrumbClick = (path, index) => {
    if (index < breadcrumbs.length - 1) {
      navigate(path);
    }
  };

  if (breadcrumbs.length <= 1 && location.pathname === '/dashboard') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && (
            <Icon name="ChevronRight" size={14} className="text-muted-foreground/60" />
          )}
          <button
            onClick={() => handleBreadcrumbClick(crumb.path, index)}
            className={`transition-smooth ${
              index === breadcrumbs.length - 1
                ? 'text-foreground font-medium cursor-default'
                : 'hover:text-foreground cursor-pointer'
            }`}
            disabled={index === breadcrumbs.length - 1}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;