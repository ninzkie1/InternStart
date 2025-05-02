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
        // Remove auto-select logic to allow 'No Organization' selection to persist
        // if (!selectedOrganization && response.data.length > 0) {
        //   console.log('Auto-selecting first organization:', response.data[0]);
        //   onOrganizationChange(response.data[0]);
        // }
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

  // Even with no organizations, we'll show the switcher with a "No Organization" option
  // This allows the user to track time without being in an organization
  const noOrganizationOption = { _id: 'no-org', name: 'No Organization' };
  
  // If there are no organizations, we'll still show the switcher with just the "No Organization" option
  if (organizations.length === 0) {
    return (
      <FormControl fullWidth variant="outlined" size="small">
        <InputLabel>Organization</InputLabel>
        <Select
          value={'no-org'}
          onChange={() => onOrganizationChange(null)}
          label="Organization"
        >
          <MenuItem value={'no-org'}>{noOrganizationOption.name}</MenuItem>
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth variant="outlined" size="small">
      <InputLabel>Organization</InputLabel>
      <Select
        value={selectedOrganization && selectedOrganization._id ? selectedOrganization._id : 'no-org'}
        onChange={(e) => {
          if (e.target.value === 'no-org') {
            // Handle 'No Organization' selection
            console.log('Selected: No Organization');
            onOrganizationChange(null);
          } else {
            // Handle regular organization selection
            const selected = organizations.find(org => org._id === e.target.value);
            console.log('Selected organization:', selected);
            onOrganizationChange(selected);
          }
        }}
        label="Organization"
      >
        {/* Add 'No Organization' option at the top */}
        <MenuItem key="no-org" value="no-org">
          No Organization
        </MenuItem>
        {/* Add divider if there are organizations */}
        {organizations.length > 0 && (
          <MenuItem disabled sx={{ borderTop: '1px solid #eee', margin: '4px 0', padding: 0 }} />
        )}
        {/* List all organizations */}
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