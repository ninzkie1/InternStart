import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getMemberLogs } from '../services/api';
import LeaderSidebarLayout from './LeaderSidebarLayout';

const LeaderAnalysis = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState('username');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMemberLogs();
      const logsWithIds = response.data.map((log, index) => ({
        id: log._id || index,
        username: log.user?.username || 'N/A',
        email: log.user?.email || 'N/A',
        date: log.date || null,
        timeIn: log.timeIn || null,
        timeOut: log.timeOut || null,
        totalHours: log.totalHours,
        status: log.status || 'N/A',
        description: log.description || 'N/A',
      }));
      setLogs(logsWithIds);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch member logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 130 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 200 },
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        const d = new Date(params.value);
        return isNaN(d) ? 'N/A' : d.toLocaleDateString();
      }
    },
    {
      field: 'timeIn',
      headerName: 'Time In',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        const d = new Date(params.value);
        return isNaN(d) ? 'N/A' : d.toLocaleTimeString();
      }
    },
    {
      field: 'timeOut',
      headerName: 'Time Out',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        const d = new Date(params.value);
        return isNaN(d) ? 'N/A' : d.toLocaleTimeString();
      }
    },
    {
      field: 'totalHours',
      headerName: 'Total Duration',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => {
        const value = params.row;
        if (!value?.timeIn || !value?.timeOut) return 'N/A';
        const timeIn = new Date(value.timeIn);
        const timeOut = new Date(value.timeOut);
        if (isNaN(timeIn) || isNaN(timeOut)) return 'N/A';
        const diffMs = timeOut - timeIn;
        if (diffMs < 0) return 'N/A';
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) return `${diffSec}s`;
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ${diffSec % 60}s`;
        const diffHr = Math.floor(diffMin / 60);
        return `${diffHr}h ${diffMin % 60}m`;
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: params.value === 'active' ? '#E8F5E9' : '#FFEBEE',
            color: params.value === 'active' ? '#2E7D32' : '#C62828',
            padding: '6px 16px',
            borderRadius: '16px',
            fontSize: '0.875rem',
          }}
        >
          {params.value}
        </Box>
      ),
    },
    
  ];

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const searchValue = searchQuery.toLowerCase();
    const fieldValue = String(log[filterField] || '').toLowerCase();
    return fieldValue.includes(searchValue);
  });

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <LeaderSidebarLayout>
      <Box sx={{ height: '100%', width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Member Activity Logs
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Filter By</InputLabel>
            <Select
              value={filterField}
              label="Filter By"
              onChange={(e) => setFilterField(e.target.value)}
            >
              <MenuItem value="username">Username</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="status">Status</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            variant="outlined"
            placeholder={`Search by ${filterField}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredLogs}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20, 50]}
            checkboxSelection
            disableSelectionOnClick
            loading={loading}
            components={{
              Toolbar: GridToolbar,
              LoadingOverlay: CircularProgress,
            }}
            sx={{
              '& .MuiDataGrid-cell': {
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
              },
            }}
            initialState={{
              sorting: {
                sortModel: [{ field: 'date', sort: 'desc' }],
              },
            }}
          />
        </Paper>
      </Box>
    </LeaderSidebarLayout>
  );
};

export default LeaderAnalysis;
