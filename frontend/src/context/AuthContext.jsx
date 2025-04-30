import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout, getProfile } from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // If we already have a user, don't make an unnecessary profile request
        if (user) {
          setLoading(false);
          return;
        }

        const userData = await getProfile();
        setUser(userData);
        setError(null);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Only clear auth state if it's an authentication error (401)
        if (error.response?.status === 401) {
          setUser(null);
          localStorage.removeItem('token');
          setError('Authentication failed');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user]);

  const login = async (credentials) => {
    try {
      console.log('AuthContext: Processing login...', credentials);
      setError(null);
      
      // If credentials contains token and user, it means we're already logged in
      if (credentials.token && credentials.user) {
        localStorage.setItem('token', credentials.token);
        setUser(credentials.user);
        return credentials.user;
      }

      // Otherwise, make the login request
      const response = await apiLogin(credentials);
      
      if (!response || !response.token) {
        throw new Error('Invalid login response');
      }

      const { token, user: userData } = response;
      
      localStorage.setItem('token', token);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      setUser(null);
      localStorage.removeItem('token');
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}; 