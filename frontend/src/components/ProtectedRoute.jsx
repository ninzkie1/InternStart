import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, error } = useAuth();

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // If there's no user and no error, redirect to login
  if (!user && !error) {
    return <Navigate to="/login" replace />;
  }

  // If there's an error but we have a token, let them stay on the page
  // The auth check will handle clearing the token if needed
  if (error && localStorage.getItem('token')) {
    return children;
  }

  // If we have a user, show the protected content
  if (user) {
    return children;
  }

  // Default case: redirect to login
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute; 