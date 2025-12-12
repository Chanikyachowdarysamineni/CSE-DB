import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link } from 'react-router-dom';
import { UserContext } from '../App';
import NotificationBell from './NotificationBell';

const navLinks = [
  { label: 'Dashboard', path: '/' },
  { label: 'Announcements', path: '/announcements' },
  { label: 'Events', path: '/events' },
  { label: 'Academics', path: '/academics' },
  { label: 'Projects', path: '/projects' },
  { label: 'Forms', path: '/forms' },
  { label: 'Resources', path: '/resources' },
  { label: 'Profile', path: '/profile' },
  { label: 'Analytics', path: '/analytics' }
];

const manageContentLink = { label: 'Manage', path: '/manage', roles: ['HOD', 'DEAN', 'Faculty'] };

const NavBar = () => {
  const user = React.useContext(UserContext);

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          CSE Department Portal - {user?.role}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {navLinks.map(link => (
            <Button
              key={link.path}
              color="inherit"
              component={Link}
              to={link.path}
              sx={{ textTransform: 'none' }}
            >
              {link.label}
            </Button>
          ))}
          {user && manageContentLink.roles.includes(user.role) && (
            <Button
              color="inherit"
              component={Link}
              to={manageContentLink.path}
              sx={{ textTransform: 'none', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              {manageContentLink.label}
            </Button>
          )}
          <NotificationBell />
          <IconButton 
            color="inherit" 
            onClick={user?.logout}
            title="Logout"
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
