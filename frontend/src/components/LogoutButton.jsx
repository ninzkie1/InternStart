import {
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const LogoutButton = () => {
  const { logout } = useAuth();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      setSnackbar({
        open: true,
        message: 'Logged out successfully',
        severity: 'success'
      });
      window.location.href = '/login';
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to logout',
        severity: 'error'
      });
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleLogout}
        sx={{ m: 1 }}
      >
        Logout
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LogoutButton; 