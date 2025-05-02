import React from 'react';
import { Box, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutButton from './LogoutButton';

const drawerWidth = 260;
const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/leader-dashboard' },
  { label: 'Analysis', icon: <AssessmentIcon />, path: '/leader-dashboard/analysis' },
  { label: 'Chat', icon: <ChatIcon />, path: '/leader-dashboard/chat' },
  { label: 'Profile', icon: <AccountCircleIcon />, path: '/leader-dashboard/profile' },
];

const LeaderSidebarLayout = ({ children }) => {
  const location = useLocation();

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
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          ml: { xs: 0, md: `${drawerWidth}px` },
          width: { xs: '100vw', md: `calc(100vw - ${drawerWidth}px)` },
          minHeight: '100vh',
          overflowX: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default LeaderSidebarLayout; 