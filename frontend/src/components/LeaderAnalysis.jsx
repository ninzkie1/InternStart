import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Snackbar,
  Button,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';

const LeaderAnalysis = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch all logs for the leader's organization
      const response = await api.get('/organizations/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(response.data || []);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch logs', severity: 'error' });
    }
  };

  useEffect(() => {
    // Filter logs based on search query
    const filtered = logs.filter(log => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (log.internName && log.internName.toLowerCase().includes(searchLower)) ||
        (log.description && log.description.toLowerCase().includes(searchLower)) ||
        (log.date && new Date(log.date).toLocaleDateString().toLowerCase().includes(searchLower))
      );
    });
    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, searchQuery]);

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredLogs.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredLogs.length / entriesPerPage);

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage + 1);
  };

  const handleEntriesPerPageChange = (event) => {
    setEntriesPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  // Stub handlers for edit/delete
  const handleEdit = (log) => {
    setSnackbar({ open: true, message: 'Edit not implemented', severity: 'info' });
  };
  const handleDelete = (log) => {
    setSnackbar({ open: true, message: 'Delete not implemented', severity: 'info' });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Analysis - Intern Logs</Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FormControl sx={{ minWidth: 100 }}>
          <Select value={entriesPerPage} onChange={handleEntriesPerPageChange} size="small">
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
          </Select>
        </FormControl>
        <TextField
          placeholder="Search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Intern Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time In</TableCell>
              <TableCell>Time Out</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentEntries.map((log, idx) => (
              <TableRow key={log._id || idx}>
                <TableCell>{log.internName || log.user?.username || '-'}</TableCell>
                <TableCell>{log.description || '-'}</TableCell>
                <TableCell>{log.date ? new Date(log.date).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{log.timeIn ? new Date(log.timeIn).toLocaleTimeString() : '-'}</TableCell>
                <TableCell>{log.timeOut ? new Date(log.timeOut).toLocaleTimeString() : '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(log)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(log)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {currentEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No logs found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Pagination controls (optional) */}
      <Box display="flex" justifyContent="center" alignItems="center" mt={2} gap={1}>
        <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
        <Typography>{currentPage} / {totalPages || 1}</Typography>
        <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default LeaderAnalysis; 