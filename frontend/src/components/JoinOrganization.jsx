import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';

const JoinOrganization = () => {
  const { token, inviteCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isDirectJoin, setIsDirectJoin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (inviteCode) {
          // Handle direct organization join
          const response = await api.get(`/api/organizations/org/${inviteCode}`);
          setOrganization(response.data);
          setIsDirectJoin(true);
        } else if (token) {
          // Handle invite token
          const response = await api.get(`/api/organizations/invite/${token}`);
          setInvite(response.data.invite);
          setOrganization(response.data.organization);
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Invalid link');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, inviteCode]);

  const handleGoogleLogin = () => {
    // Store the invite information in localStorage
    if (isDirectJoin) {
      localStorage.setItem('pendingOrgInviteCode', inviteCode);
    } else {
      localStorage.setItem('pendingInviteToken', token);
    }
    // Redirect to Google login
    window.location.href = `${process.env.BACKEND_URL}/api/auth/google`;
  };

  const handleJoinOrganization = async () => {
    try {
      setLoading(true);
      if (isDirectJoin) {
        await api.post(`/api/organizations/org/${inviteCode}/join`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await api.post(`/api/organizations/join/${token}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join organization');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Join Organization
        </Typography>
        
        {organization && (
          <>
            <Typography variant="h6" gutterBottom>
              {organization.name}
            </Typography>
            <Typography color="textSecondary" paragraph>
              {organization.description}
            </Typography>
            {organization.leader && (
              <Typography variant="subtitle2" color="textSecondary">
                Led by: {organization.leader.username}
              </Typography>
            )}
          </>
        )}

        {!user ? (
          <Box sx={{ mt: 3 }}>
            <Typography paragraph>
              Please sign in with Google to join this organization
            </Typography>
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              fullWidth
            >
              Sign in with Google
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Typography paragraph>
              You are signed in as {user.email}
            </Typography>
            {isDirectJoin || (invite && user.email === invite.email) ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleJoinOrganization}
                fullWidth
              >
                Join Organization
              </Button>
            ) : (
              <Alert severity="warning">
                This invite was sent to {invite.email}. Please sign in with that email address.
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default JoinOrganization; 