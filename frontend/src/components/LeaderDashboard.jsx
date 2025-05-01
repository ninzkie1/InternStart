import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Paper,
  Snackbar,
  CardHeader,
  DialogContentText,
  Drawer,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  ContentCopy as ContentCopyIcon,
  PersonRemove as PersonRemoveIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';
import LogoutButton from './LogoutButton';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 260;
const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/leader-dashboard' },
  { label: 'Analysis', icon: <AssessmentIcon />, path: '/leader-dashboard/analysis' },
  { label: 'Chat', icon: <ChatIcon />, path: '/leader-dashboard/chat' },
  { label: 'Profile', icon: <AccountCircleIcon />, path: '/leader-dashboard/profile' },
];

const LeaderDashboard = () => {
  const [organization, setOrganization] = useState(null);
  const [openOrgDialog, setOpenOrgDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [joinRequests, setJoinRequests] = useState([]);
  const { user } = useAuth();
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  useEffect(() => {
    if (organization) {
      fetchJoinRequests();
    }
  }, [organization]);

  const fetchOrganization = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/organizations/my-org', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Organization data:', response.data);
      setOrganization(response.data);
      if (response.data) {
        setMembers(response.data.members || []);
        setOrgForm({
          name: response.data.name,
          description: response.data.description
        });
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      // If 404, do not set error (just means no org yet)
      if (error.response && error.response.status === 404) {
        setOrganization(null);
        setError('');
      } else {
        setError('Failed to fetch organization details');
      }
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setError('Authentication required');
        return;
      }

      if (!organization) {
        console.log('No organization data yet, skipping join requests fetch');
        return;
      }

      console.log('Fetching join requests...');
      const response = await api.get('/organizations/join-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Join requests response:', response.data);
      
      if (Array.isArray(response.data)) {
        setJoinRequests(response.data);
        setError(''); // Clear any existing errors
      } else {
        console.error('Invalid join requests response format:', response.data);
        setError('Invalid response format from server');
        setJoinRequests([]);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || 'Failed to fetch join requests');
      setJoinRequests([]); // Reset join requests on error
    }
  };

  const handleCreateOrg = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await api.post('/organizations', orgForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganization(response.data);
      setOpenOrgDialog(false);
      setOrgForm({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating organization:', error);
      setError('Failed to create organization');
    }
  };

  const handleUpdateOrg = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await api.put(`/organizations/${organization._id}`, orgForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganization(response.data);
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      setError('Failed to update organization');
    }
  };

  const handleInvite = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await api.post(`/organizations/${organization._id}/invite`, {
        email: inviteEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Copy invite link to clipboard
      navigator.clipboard.writeText(response.data.inviteLink);
      setSnackbarMessage('Invite link copied to clipboard!');
      setSnackbarOpen(true);
      
      setOpenInviteDialog(false);
      setInviteEmail('');
    } catch (error) {
      console.error('Error inviting member:', error);
      setError('Failed to send invitation');
    }
  };

  const handleJoinRequest = async (requestId, approve) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(
        `/organizations/join-requests/${requestId}/${approve ? 'approve' : 'decline'}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbarMessage(`Join request ${approve ? 'approved' : 'declined'} successfully`);
      setSnackbarOpen(true);
      fetchJoinRequests(); // Refresh join requests
      fetchOrganization(); // Refresh organization data to update members list
    } catch (error) {
      console.error('Error handling join request:', error);
      setError(`Failed to ${approve ? 'approve' : 'decline'} join request`);
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/organizations/${organization._id}/members/${member._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbarMessage('Member removed successfully');
      setSnackbarOpen(true);
      fetchOrganization(); // Refresh the organization data
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    }
  };

  const joinRequestsCard = (
    <Grid item xs={12}>
      <Card>
        <CardHeader title="Pending Join Requests" />
        <CardContent>
          {joinRequests.length > 0 ? (
            <List>
              {joinRequests.map((request) => (
                <ListItem
                  key={request._id}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="approve"
                        onClick={() => handleJoinRequest(request._id, true)}
                        color="success"
                        sx={{ mr: 1 }}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="decline"
                        onClick={() => handleJoinRequest(request._id, false)}
                        color="error"
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={request.user.username}
                    secondary={`Email: ${request.user.email} • Requested: ${new Date(
                      request.createdAt
                    ).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="textSecondary">
              No pending join requests
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );

  const snackbar = (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      onClose={() => setSnackbarOpen(false)}
      message={snackbarMessage}
    />
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src="/img/internstartlogo.png" alt="Logo" style={{ width: 60, height: 60 }} />
            <Typography variant="h6" color="primary">Leader Panel</Typography>
          </Box>
          <Divider />
          <List>
            {navItems.map((item) => (
              <ListItem
                button
                key={item.label}
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: location.pathname === item.path ? 'primary.light' : 'inherit',
                  color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  '&:hover': { bgcolor: 'primary.lighter' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          <Box flexGrow={1} />
          <Box sx={{ p: 2 }}>
            <LogoutButton />
          </Box>
        </Box>
      </Drawer>
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px` }}>
        {/* Header with greeting */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h5" color="primary">
            Hello, {user?.username || 'User'}
          </Typography>
        </Box>
        {/* Dashboard content: organization, members, join requests, etc. */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {/* User Profile Card */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5">{user?.username}</Typography>
                  <Typography color="textSecondary">{user?.email}</Typography>
                  <Typography color="primary" variant="subtitle2" sx={{ mt: 0.5 }}>
                    Role: {user?.role}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        {/* Organization Section */}
        {!organization ? (
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Welcome, {user?.username}! Create your organization to get started.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenOrgDialog(true)}
                sx={{ mt: 2 }}
              >
                Create Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" gutterBottom>
                      {organization.name}
                    </Typography>
                    <IconButton onClick={() => setOpenEditDialog(true)} color="primary">
                      <EditIcon />
                    </IconButton>
                  </Box>
                  <Typography color="textSecondary" paragraph>
                    {organization.description}
                  </Typography>
                  {/* Organization Link Section */}
                  <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Organization Link
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {organization.inviteCode ? (
                        <>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              bgcolor: 'background.paper',
                              p: 1,
                              borderRadius: 1,
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {`${window.location.origin}/join-organization/org/${organization.inviteCode}`}
                          </Typography>
                          <IconButton
                            color="primary"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/join-organization/org/${organization.inviteCode}`
                              );
                              setSnackbarMessage('Organization link copied to clipboard!');
                              setSnackbarOpen(true);
                            }}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </>
                      ) : (
                        <Typography color="error">
                          Organization link not available. Please try refreshing the page.
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      Share this link to allow people to join your organization directly
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setOpenInviteDialog(true)}
                  >
                    Invite Member
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            {/* Members Section */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="Organization Members" />
                <CardContent>
                  <List>
                    {members.map((member) => (
                      <ListItem
                        key={member._id}
                        secondaryAction={
                          member._id !== organization.leader && (
                            <IconButton
                              edge="end"
                              aria-label="remove member"
                              onClick={() => {
                                setMemberToRemove(member);
                                setRemoveDialogOpen(true);
                              }}
                              color="error"
                            >
                              <PersonRemoveIcon />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemText
                          primary={member.username}
                          secondary={member.email}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            {/* Pending Join Requests Section */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="Pending Join Requests" />
                <CardContent>
                  {joinRequests.length > 0 ? (
                    <List>
                      {joinRequests.map((request) => (
                        <ListItem
                          key={request._id}
                          secondaryAction={
                            <Box>
                              <IconButton
                                edge="end"
                                aria-label="approve"
                                onClick={() => handleJoinRequest(request._id, true)}
                                color="success"
                                sx={{ mr: 1 }}
                              >
                                <CheckIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="decline"
                                onClick={() => handleJoinRequest(request._id, false)}
                                color="error"
                              >
                                <CloseIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={request.user.username}
                            secondary={`Email: ${request.user.email} • Requested: ${new Date(
                              request.createdAt
                            ).toLocaleDateString()}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="textSecondary">
                      No pending join requests
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        {/* Create Organization Dialog */}
        <Dialog open={openOrgDialog} onClose={() => setOpenOrgDialog(false)}>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Organization Name"
              fullWidth
              value={orgForm.name}
              onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={orgForm.description}
              onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOrgDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateOrg} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
        {/* Edit Organization Dialog */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Organization Name"
              fullWidth
              value={orgForm.name}
              onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={orgForm.description}
              onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateOrg} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
        {/* Invite Member Dialog */}
        <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)}>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Email Address"
              type="email"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
            <Button onClick={handleInvite} variant="contained">
              Send Invite
            </Button>
          </DialogActions>
        </Dialog>
        {/* Remove Member Confirmation Dialog */}
        <Dialog
          open={removeDialogOpen}
          onClose={() => {
            setRemoveDialogOpen(false);
            setMemberToRemove(null);
          }}
        >
          <DialogTitle>Remove Member</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to remove {memberToRemove?.username} from the organization?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setRemoveDialogOpen(false);
                setMemberToRemove(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleRemoveMember(memberToRemove)}
              color="error"
              variant="contained"
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>
        {snackbar}
        <Box component="footer" sx={{ textAlign: 'center', py: 2, color: 'text.secondary', fontSize: 14 }}>
          InternStart 2025. Created and designed by Nino Rey Garbo
        </Box>
      </Box>
    </Box>
  );
};

export default LeaderDashboard; 