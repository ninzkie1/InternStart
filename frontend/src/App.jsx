import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Box, Flex, Spacer } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import LogoutButton from './components/LogoutButton';

// Separate component for the authenticated header
const AuthHeader = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return null;
  
  return (
    <Flex p={4} bg="white" shadow="sm">
      <Spacer />
      <LogoutButton />
    </Flex>
  );
};

function App() {
  return (
    <ChakraProvider>
      <AuthProvider>
        <Box minH="100vh" bg="gray.50">
          <AuthHeader />
          <Router>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Dashboard (Protected Route)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <Navigate to="/dashboard" replace />
                }
              />
            </Routes>
          </Router>
        </Box>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
