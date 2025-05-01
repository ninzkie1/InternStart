import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, Container, Paper, Button, Stack, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Use import.meta.env for Vite environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const JoinOrganization = () => {
  const { inviteCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Extract invite code from any URL pattern
  const getInviteCode = () => {
    const pathParts = location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  };

  const actualInviteCode = inviteCode || getInviteCode();

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        console.log('Fetching organization with invite code:', actualInviteCode);
        const response = await axios.get(`${API_URL}/organizations/org/${actualInviteCode}`);
        setOrganization(response.data);
      } catch (error) {
        console.error('Error fetching organization:', error);
        setError(error.response?.data?.message || 'Failed to fetch organization');
      } finally {
        setLoading(false);
      }
    };

    if (actualInviteCode) {
      fetchOrganization();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [actualInviteCode]);

  const handleJoinOrganization = async () => {
    try {
      setJoining(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Joining organization with invite code:', actualInviteCode);
      const response = await axios.post(
        `${API_URL}/organizations/org/${actualInviteCode}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error joining organization:', error);
      setError(error.response?.data?.message || 'Failed to join organization');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, backgroundColor: '#fff3f3' }}>
            <Typography color="error">{error}</Typography>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/"
                size="small"
              >
                Go to Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Join Organization
          </Typography>
          <Typography variant="h5" gutterBottom>
            {organization?.name}
          </Typography>
          <Typography variant="body1" paragraph>
            {organization?.description}
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Led by: {organization?.leader?.email}
          </Typography>

          <Box sx={{ mt: 3 }}>
            {isAuthenticated ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleJoinOrganization}
                fullWidth
                disabled={joining}
              >
                {joining ? 'Joining...' : 'Join Organization'}
              </Button>
            ) : (
              <Stack spacing={2}>
                <Typography variant="body1" align="center">
                  Please log in or create an account to join this organization
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to={`/login?redirect=/join-organization/org/${actualInviteCode}`}
                  fullWidth
                >
                  Login to Join
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  component={Link}
                  to={`/register?redirect=/join-organization/org/${actualInviteCode}`}
                  fullWidth
                >
                  Create New Account
                </Button>
              </Stack>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default JoinOrganization; 