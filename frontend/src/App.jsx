import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './views/Dashboard';
import LeaderDashboard from './components/LeaderDashboard';
import PrivateRoute from './components/PrivateRoute';
import JoinOrganization from './pages/JoinOrganization';
import LeaderAnalysis from './components/LeaderAnalysis';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// Add favicon and page title
if (typeof document !== 'undefined') {
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/png';
  favicon.href = '/img/internstartlogo.png';
  document.head.appendChild(favicon);
  document.title = 'InternStart';
}

const App = () => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/join/:inviteCode" element={<JoinOrganization />} />
            <Route path="/join-organization/:inviteCode" element={<JoinOrganization />} />
            <Route path="/join-organization/org/:inviteCode" element={<JoinOrganization />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/leader-dashboard"
              element={
                <PrivateRoute>
                  <LeaderDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/leader-dashboard/analysis"
              element={
                <PrivateRoute>
                  <LeaderAnalysis />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
