import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  Grid,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment,
  Tooltip,
  Alert,
  AlertTitle,
  CircularProgress,
  useTheme,
  Snackbar,
  Avatar,
  TablePagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Check as CheckIcon,
  Timer as TimerIcon,
  History as HistoryIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { timeIn, timeOut, getTodayLog, getLogs, updateLogDescription, deleteLog } from '../services/api';
import axios from 'axios';
import Todo from '../components/Todo';
import { styled } from '@mui/material/styles';
import LogoutButton from '../components/LogoutButton';
import { useAuth } from '../context/AuthContext';
import OrganizationSwitcher from '../components/OrganizationSwitcher';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius * 2,
  height: '100%',
}));

const StyledStatCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
}));

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [description, setDescription] = useState('');
  const [editingLog, setEditingLog] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const cancelRef = React.useRef();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const theme = useTheme();

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showNotification = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const fetchTodayLog = useCallback(async () => {
    try {
      const orgId = selectedOrganization ? selectedOrganization._id : undefined;
      const response = await getTodayLog(orgId);
      
      // If no log found for today but there's an ongoing session in the logs,
      // use that as today's log
      if (!response.data && logs.length > 0) {
        const ongoingLog = logs.find(log => log.status === 'ongoing');
        if (ongoingLog) {
          setTodayLog(ongoingLog);
          if (ongoingLog.timeIn) {
            const timeIn = new Date(ongoingLog.timeIn);
            const now = new Date();
            const duration = (now - timeIn) / (1000 * 60 * 60); // Convert to hours
            setCurrentDuration(duration);
          }
          return;
        }
      }
      
      setTodayLog(response.data);
    } catch (error) {
      console.error('Error fetching today\'s log:', error);
      showNotification('Failed to fetch today\'s log', 'error');
    }
  }, [logs, selectedOrganization]);

  const fetchLogs = useCallback(async () => {
    try {
      const orgId = selectedOrganization ? selectedOrganization._id : undefined;
      const response = await getLogs(orgId);
      setLogs(response.data);

      // Calculate total duration from all completed logs
      const total = response.data.reduce((acc, log) => {
        return acc + (log.totalHours || 0);
      }, 0);
      setTotalDuration(total);
    } catch (error) {
      console.error('Error fetching logs:', error);
      showNotification('Failed to fetch logs history', 'error');
    }
  }, [selectedOrganization]);

  // Update current duration every second if there's an ongoing session
  useEffect(() => {
    let intervalId;
    
    const updateDuration = () => {
      const activeLog = todayLog?.status === 'ongoing' ? todayLog : logs.find(log => log.status === 'ongoing');
      
      if (activeLog?.timeIn) {
        const timeIn = new Date(activeLog.timeIn);
        const now = new Date();
        const duration = (now - timeIn) / (1000 * 60 * 60); // Convert to hours
        setCurrentDuration(duration);
      } else {
        setCurrentDuration(0);
      }
    };

    if (todayLog?.status === 'ongoing' || logs.some(log => log.status === 'ongoing')) {
      // Initial calculation
      updateDuration();

      // Update every 30 seconds instead of every second
      intervalId = setInterval(updateDuration, 30000);
    } else {
      setCurrentDuration(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [todayLog, logs]);

  // Initial data fetch
  useEffect(() => {
    fetchTodayLog();
    fetchLogs();
    const refreshInterval = setInterval(() => {
      fetchTodayLog();
      fetchLogs();
    }, 300000);
    return () => clearInterval(refreshInterval);
  }, [fetchTodayLog, fetchLogs]);

  useEffect(() => {
    // Filter logs based on search query
    const filtered = logs.filter(log => {
      const searchLower = searchQuery.toLowerCase();
      const date = new Date(log.date).toLocaleDateString().toLowerCase();
      const timeIn = new Date(log.timeIn).toLocaleString().toLowerCase();
      const timeOut = log.timeOut ? new Date(log.timeOut).toLocaleString().toLowerCase() : '';
      const description = (log.description || '').toLowerCase();
      const status = log.status.toLowerCase();

      return (
        date.includes(searchLower) ||
        timeIn.includes(searchLower) ||
        timeOut.includes(searchLower) ||
        description.includes(searchLower) ||
        status.includes(searchLower)
      );
    });
    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [logs, searchQuery]);

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredLogs.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredLogs.length / entriesPerPage);

  // Handle page changes
  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage + 1);
  };

  // Handle entries per page change
  const handleEntriesPerPageChange = (event) => {
    setEntriesPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset to first page when changing entries per page
  };

  const handleTimeIn = async () => {
    setIsLoading(true);
    try {
      const orgId = selectedOrganization ? selectedOrganization._id : undefined;
      await timeIn({ description, organizationId: orgId });
      setDescription('');
      showNotification('Time In recorded successfully');
      await fetchTodayLog();
      await fetchLogs();
    } catch (error) {
      console.error('Error recording time in:', error);
      showNotification(error.response?.data?.message || 'Failed to record Time In', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeOut = async () => {
    setIsLoading(true);
    try {
      const orgId = selectedOrganization ? selectedOrganization._id : undefined;
      await timeOut({ description, organizationId: orgId });
      setDescription('');
      showNotification('Time Out recorded successfully');
      await fetchTodayLog();
      await fetchLogs();
    } catch (error) {
      console.error('Error recording time out:', error);
      showNotification(error.response?.data?.message || 'Failed to record Time Out', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDescription = async () => {
    if (!editingLog) return;

    setIsLoading(true);
    try {
      await updateLogDescription(editingLog._id, description);
      showNotification('Description updated successfully');
      await fetchTodayLog();
      await fetchLogs();
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating description:', error);
      showNotification(error.response?.data?.message || 'Failed to update description', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => setIsOpen(true);
  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingLog(null);
    setDescription('');
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setDescription(log.description || '');
    handleOpenDialog();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Add new function to format time only
  const formatTimeOnly = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (hours) => {
    if (!hours && hours !== 0) return '00:00:00';
    const totalSeconds = Math.floor(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Add delete handler
  const handleDelete = async () => {
    if (!logToDelete) return;

    setIsLoading(true);
    try {
      await deleteLog(logToDelete._id);
      showNotification('Log deleted successfully');
      await fetchLogs();
      setIsDeleteDialogOpen(false);
      setLogToDelete(null);
    } catch (error) {
      console.error('Error deleting log:', error);
      showNotification(error.response?.data?.message || 'Failed to delete log', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (log) => {
    setLogToDelete(log);
    setIsDeleteDialogOpen(true);
  };

  // console.log('Current state:', { todayLog, logs, currentDuration });

  // Split logs into organization and personal logs
  const orgLogs = logs.filter(log => log.organization);
  const personalLogs = logs.filter(log => !log.organization);

  // Pagination for org logs
  const [orgPage, setOrgPage] = useState(1);
  const [orgEntriesPerPage, setOrgEntriesPerPage] = useState(10);
  const orgIndexOfLastEntry = orgPage * orgEntriesPerPage;
  const orgIndexOfFirstEntry = orgIndexOfLastEntry - orgEntriesPerPage;
  const orgCurrentEntries = orgLogs.slice(orgIndexOfFirstEntry, orgIndexOfLastEntry);
  const orgTotalPages = Math.ceil(orgLogs.length / orgEntriesPerPage);

  // Pagination for personal logs
  const [personalPage, setPersonalPage] = useState(1);
  const [personalEntriesPerPage, setPersonalEntriesPerPage] = useState(10);
  const personalIndexOfLastEntry = personalPage * personalEntriesPerPage;
  const personalIndexOfFirstEntry = personalIndexOfLastEntry - personalEntriesPerPage;
  const personalCurrentEntries = personalLogs.slice(personalIndexOfFirstEntry, personalIndexOfLastEntry);
  const personalTotalPages = Math.ceil(personalLogs.length / personalEntriesPerPage);

  return (
    <div>
      <Box 
        component="header" 
        sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          py: 1,
          px: 2
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src="/img/internstartlogo.png"
              alt="Logo"
              variant="square"
              sx={{ width: 100, height: 100 }}
            />
            <Typography variant="h6" color="primary">
              Hello, {user?.username || 'User'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 250 }}>
              <OrganizationSwitcher
                selectedOrganization={selectedOrganization}
                onOrganizationChange={setSelectedOrganization}
              />
            </Box>
            <LogoutButton />
          </Box>
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
        {/* Main content */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Today's Time Log Card */}
              <StyledCard>
                <CardContent>
                  <Stack spacing={3}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h5" component="h2">
                        Today's Time Log
                      </Typography>
                      <TodayIcon color="primary" fontSize="large" />
                    </Box>
                <Divider />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <StyledStatCard>
                          <Typography variant="subtitle1" gutterBottom>
                            Current Session
                          </Typography>
                          <Typography variant="h4">
                      {(todayLog?.status === 'ongoing' || logs.some(log => log.status === 'ongoing')) 
                        ? formatDuration(currentDuration) 
                        : '00:00:00'}
                          </Typography>
                          <TimerIcon sx={{ mt: 1 }} />
                        </StyledStatCard>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledStatCard>
                          <Typography variant="subtitle1" gutterBottom>
                            Total Hours Worked
                          </Typography>
                          <Typography variant="h4">
                      {formatDuration(totalDuration)}
                          </Typography>
                          <HistoryIcon sx={{ mt: 1 }} />
                        </StyledStatCard>
                      </Grid>
                    </Grid>

                {todayLog ? (
                      <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                        <Stack spacing={2}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TimeIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="medium">
                              Time In:
                            </Typography>
                            <Typography>
                              {todayLog.timeIn ? formatDate(todayLog.timeIn) : 'Not yet recorded'}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TimeIcon color="error" />
                            <Typography variant="subtitle1" fontWeight="medium">
                              Time Out:
                            </Typography>
                            <Typography>
                              {todayLog.timeOut ? formatDate(todayLog.timeOut) : 'Not yet recorded'}
                            </Typography>
                          </Box>
                    {todayLog.totalHours > 0 && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <TimerIcon color="success" />
                              <Typography variant="subtitle1" fontWeight="medium">
                                Total Duration:
                              </Typography>
                              <Typography>
                                {formatDuration(todayLog.totalHours)}
                              </Typography>
                            </Box>
                          )}
                          <Chip
                            label={todayLog.status}
                            color={todayLog.status === 'ongoing' ? 'success' : 'primary'}
                            sx={{ alignSelf: 'flex-start' }}
                          />
                        </Stack>
                      </Paper>
                    ) : (
                      <Typography color="text.secondary">No time log for today</Typography>
                    )}

                    <TextField
                      multiline
                      rows={3}
                  placeholder="What are you working on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        readOnly: todayLog && todayLog.status === 'ongoing'
                      }}
                    />

                    <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                        variant="contained"
                        color="primary"
                        size="large"
                    onClick={handleTimeIn}
                        disabled={isLoading || todayLog?.status === 'ongoing' || logs.some(log => log.status === 'ongoing')}
                        startIcon={<TimeIcon />}
                        sx={{ minWidth: 150 }}
                  >
                    Time In
                  </Button>
                  <Button
                        variant="contained"
                        color="error"
                        size="large"
                    onClick={handleTimeOut}
                        disabled={isLoading || !(todayLog?.status === 'ongoing' || logs.some(log => log.status === 'ongoing'))}
                        startIcon={<CheckIcon />}
                        sx={{ minWidth: 150 }}
                  >
                    Time Out
                  </Button>
                </Stack>
              </Stack>
                </CardContent>
              </StyledCard>

              {/* Organization Logs Section */}
              {selectedOrganization && orgLogs.length > 0 && (
                <StyledCard sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Organization Time Logs
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Time In</TableCell>
                            <TableCell>Time Out</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orgCurrentEntries.map((log) => (
                            <TableRow key={log._id} hover>
                              <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                              <TableCell>{formatTimeOnly(log.timeIn)}</TableCell>
                              <TableCell>{log.timeOut ? formatTimeOnly(log.timeOut) : '-'}</TableCell>
                              <TableCell>{log.totalHours ? formatDuration(log.totalHours) : '-'}</TableCell>
                              <TableCell><Typography noWrap>{log.description || '-'}</Typography></TableCell>
                              <TableCell>
                                <Chip label={log.status} color={log.status === 'ongoing' ? 'success' : 'primary'} size="small" />
                              </TableCell>
                             
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Tooltip title="Edit log">
                                    <IconButton size="small" onClick={() => openEditModal(log)} color="primary">
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete log">
                                    <span>
                                      <IconButton size="small" onClick={() => openDeleteDialog(log)} color="error" disabled={log.status === 'ongoing'}>
                                        <DeleteIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Showing {orgIndexOfFirstEntry + 1} to {Math.min(orgIndexOfLastEntry, orgLogs.length)} of {orgLogs.length} entries
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => setOrgPage(p => Math.max(1, p - 1))} disabled={orgPage === 1} size="small">
                          <ChevronLeftIcon />
                        </IconButton>
                        <Typography>{orgPage} / {orgTotalPages || 1}</Typography>
                        <IconButton onClick={() => setOrgPage(p => Math.min(orgTotalPages, p + 1))} disabled={orgPage === orgTotalPages} size="small">
                          <ChevronRightIcon />
                        </IconButton>
                      </Stack>
                      <FormControl sx={{ minWidth: 80 }} size="small">
                        <Select value={orgEntriesPerPage} onChange={e => { setOrgEntriesPerPage(Number(e.target.value)); setOrgPage(1); }}>
                          <MenuItem value={5}>5</MenuItem>
                          <MenuItem value={10}>10</MenuItem>
                          <MenuItem value={25}>25</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </CardContent>
                </StyledCard>
              )}

              {/* Personal Logs Section */}
              {personalLogs.length > 0 && (
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Personal Time Logs
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Time In</TableCell>
                            <TableCell>Time Out</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {personalCurrentEntries.map((log) => (
                            <TableRow key={log._id} hover>
                              <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                              <TableCell>{formatTimeOnly(log.timeIn)}</TableCell>
                              <TableCell>{log.timeOut ? formatTimeOnly(log.timeOut) : '-'}</TableCell>
                              <TableCell>{log.totalHours ? formatDuration(log.totalHours) : '-'}</TableCell>
                              <TableCell><Typography noWrap>{log.description || '-'}</Typography></TableCell>
                              <TableCell>
                                <Chip label={log.status} color={log.status === 'ongoing' ? 'success' : 'primary'} size="small" />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Tooltip title="Edit log">
                                    <IconButton size="small" onClick={() => openEditModal(log)} color="primary">
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete log">
                                    <span>
                                      <IconButton size="small" onClick={() => openDeleteDialog(log)} color="error" disabled={log.status === 'ongoing'}>
                                        <DeleteIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Showing {personalIndexOfFirstEntry + 1} to {Math.min(personalIndexOfLastEntry, personalLogs.length)} of {personalLogs.length} entries
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => setPersonalPage(p => Math.max(1, p - 1))} disabled={personalPage === 1} size="small">
                          <ChevronLeftIcon />
                        </IconButton>
                        <Typography>{personalPage} / {personalTotalPages || 1}</Typography>
                        <IconButton onClick={() => setPersonalPage(p => Math.min(personalTotalPages, p + 1))} disabled={personalPage === personalTotalPages} size="small">
                          <ChevronRightIcon />
                        </IconButton>
                      </Stack>
                      <FormControl sx={{ minWidth: 80 }} size="small">
                        <Select value={personalEntriesPerPage} onChange={e => { setPersonalEntriesPerPage(Number(e.target.value)); setPersonalPage(1); }}>
                          <MenuItem value={5}>5</MenuItem>
                          <MenuItem value={10}>10</MenuItem>
                          <MenuItem value={25}>25</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </CardContent>
                </StyledCard>
              )}
            </Stack>
          </Grid>

        {/* Todo section */}
          <Grid item xs={12} md={4}>
            <Box position="sticky" top={16}>
          <Todo />
        </Box>
          </Grid>
        </Grid>

        {/* Edit Description Dialog */}
        <Dialog open={isOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Description</DialogTitle>
          <DialogContent>
            <TextField
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleEditDescription}
              variant="contained"
              disabled={isLoading}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

      {/* Delete Confirmation Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setLogToDelete(null);
        }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Time Log</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Warning</AlertTitle>
              Are you sure you want to delete this time log?
            </Alert>
              {logToDelete && (
              <Paper sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography>
                    <strong>Date:</strong> {new Date(logToDelete.date).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    <strong>Time In:</strong> {formatTimeOnly(logToDelete.timeIn)}
                  </Typography>
                  {logToDelete.timeOut && (
                    <Typography>
                      <strong>Time Out:</strong> {formatTimeOnly(logToDelete.timeOut)}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setLogToDelete(null);
              }}
            >
                Cancel
              </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={isLoading}
            >
                Delete
              </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
    </Container>
    <Box component="footer" sx={{ textAlign: 'center', py: 2, color: 'text.secondary', fontSize: 14 }}>
      InternStart 2025. Created and designed by Nino Rey Garbo
    </Box>
  </div>
  );
};

export default Dashboard; 