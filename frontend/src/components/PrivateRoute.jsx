import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} />;
  }

  // Role-based protection for leader dashboard
  if (
    location.pathname === '/leader-dashboard' &&
    user?.role !== 'leader'
  ) {
    // If not a leader, redirect to intern dashboard
    return <Navigate to="/dashboard" />;
  }

  // Render the protected component if authenticated
  return children;
};

export default PrivateRoute; 