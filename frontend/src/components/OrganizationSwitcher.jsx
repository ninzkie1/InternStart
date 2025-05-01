import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import api from '../config/axios';

const OrganizationSwitcher = ({ selectedOrganization, onOrganizationChange }) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        console.log('Fetching organizations...');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No auth token found');
          setError('Authentication required');
          setLoading(false);
          return;
        }

        console.log('Making request to /organizations/my-organizations');
        const response = await api.get('/organizations/my-organizations');
        console.log('Organizations response:', response.data);
        
        setOrganizations(response.data);
        
        // If no organization is selected and we have organizations, select the first one
        if (!selectedOrganization && response.data.length > 0) {
          console.log('Auto-selecting first organization:', response.data[0]);
          onOrganizationChange(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setError(error.response?.data?.message || 'Failed to fetch organizations');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [selectedOrganization, onOrganizationChange]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2">Loading organizations...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        {error === 'Authentication required' && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Please log out and log in again to refresh your session.
          </Typography>
        )}
      </Alert>
    );
  }

  if (organizations.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        You are not a member of any organization. Please join an organization to start tracking time.
      </Alert>
    );
  }

  return (
    <FormControl fullWidth variant="outlined" size="small">
      <InputLabel>Organization</InputLabel>
      <Select
        value={selectedOrganization?._id || ''}
        onChange={(e) => {
          const selected = organizations.find(org => org._id === e.target.value);
          console.log('Selected organization:', selected);
          onOrganizationChange(selected);
        }}
        label="Organization"
      >
        {organizations.map((org) => (
          <MenuItem key={org._id} value={org._id}>
            {org.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default OrganizationSwitcher; 