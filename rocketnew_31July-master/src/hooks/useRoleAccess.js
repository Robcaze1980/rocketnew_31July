import { useAuth } from '../contexts/AuthContext';

export const useRoleAccess = () => {
  const { userProfile, loading } = useAuth();

  const hasRole = (requiredRole) => {
    if (loading || !userProfile?.role) return false;

    const roleHierarchy = {
      'admin': ['admin', 'manager', 'member'],
      'manager': ['manager', 'member'],
      'member': ['member']
    };

    return roleHierarchy?.[userProfile?.role]?.includes(requiredRole) || false;
  };

  // Return boolean values instead of functions to prevent re-renders
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager') || hasRole('admin');
  const isMember = hasRole('member');

  const canAccessManagerFeatures = userProfile?.role === 'admin' || userProfile?.role === 'manager';

  return {
    userRole: userProfile?.role || null,
    hasRole,
    isAdmin,
    isManager,
    isMember,
    canAccessManagerFeatures,
    loading
  };
};

export default useRoleAccess;
