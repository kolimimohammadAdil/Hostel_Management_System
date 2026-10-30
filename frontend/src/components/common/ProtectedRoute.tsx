import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { getPortalPathForRole } from '../../utils/portalRoutes';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

/**
 * Route protection wrapper:
 * Enforces strict seven-role portal isolation.
 *  - Unauthenticated visitors are redirected to /login.
 *  - Authenticated users attempting to access another role's portal are redirected
 *    to their own authorized portal.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { role, isAuthenticated, isAuthenticating } = useApp();
  const location = useLocation();

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060b17]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Verifying ALTS institutional credentials...</p>
        </div>
      </div>
    );
  }

  // 1. If not authenticated, redirect to /login
  if (!role || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Strict portal isolation: if user role is not authorized for this route,
  // redirect them directly to their own authorized portal
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const userAuthorizedPortal = getPortalPathForRole(role);
    return (
      <Navigate
        to={userAuthorizedPortal}
        state={{ unauthorizedAttempt: true, from: location.pathname }}
        replace
      />
    );
  }

  return children;
};
