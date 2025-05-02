import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !email) {
      if (!email) {
        setError('Please enter your email');
      }
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot-password`, { email });
      
      setSuccess(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', mt: 3 }}>
          <CardContent>
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Forgot Password
            </Typography>
            
            {success ? (
              <Box sx={{ textAlign: 'center', my: 3 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Password reset instructions have been sent to your email.
                </Alert>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Please check your inbox (and spam folder) for an email with instructions to reset your password.
                </Typography>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button variant="contained" color="primary">
                    Return to Login
                  </Button>
                </Link>
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                  <Box sx={{ textAlign: 'center' }}>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                      <Typography color="primary">
                        Back to Login
                      </Typography>
                    </Link>
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
