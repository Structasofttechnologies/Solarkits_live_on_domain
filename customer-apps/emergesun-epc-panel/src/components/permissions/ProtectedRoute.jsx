import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getSession } from '../../mocks/auth';

/**
 * Redirects to /login if there is no valid session.
 */
export default function ProtectedRoute() {
  const session = getSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
