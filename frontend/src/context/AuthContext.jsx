import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

// Create a context with a more descriptive name for better debugging
export const AuthContext = createContext(null);

// Hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component that wraps the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      // Don't automatically navigate during initial auth check
      // Only authenticate the user if possible
      if (token) {
        try {
          const response = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setUser(null);
          // Don't navigate away automatically if auth check fails
          // This allows the Register component to handle its own redirection
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', token);
      setUser(user);
      console.log('Logged in user:', user);

      // Redirect based on role
      if (user.role === 'leader') {
        navigate('/leader-dashboard');
      } else {
        navigate('/dashboard');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData, redirectPath = null) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Save the token and user data
      const { token } = response.data;
      if (!token) {
        console.error('No token received from registration');
      }
      
      // Store token and update user state immediately
      localStorage.setItem('token', token);
      setUser(response.data);
      
      console.log('Registration successful, redirect path:', redirectPath);
      
      // Small delay to ensure the token is saved before redirect
      setTimeout(() => {
        // Use the provided redirect path if available
        if (redirectPath && redirectPath.includes('/join')) {
          console.log('Redirecting to join organization:', redirectPath);
          navigate(redirectPath);
        } else {
          // Default redirect based on role
          if (response.data.role === 'leader') {
            navigate('/leader-dashboard');
          } else {
            navigate('/dashboard');
          }
        }
      }, 100);
      
      return { success: true, token };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Note: We're using named exports only, no default export
// This provides better compatibility with React Fast Refresh 