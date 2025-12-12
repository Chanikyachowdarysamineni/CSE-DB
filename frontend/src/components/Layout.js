import React from 'react';
import { CssBaseline, Container, Box, Chip } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';
import NavBar from './NavBar';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { useSocket } from '../contexts/SocketContext';

const Layout = ({ children }) => {
  const { connected } = useSocket();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavBar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
          <Chip
            icon={connected ? <Wifi /> : <WifiOff />}
            label={connected ? 'Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
            size="small"
            sx={{ boxShadow: 2 }}
          />
        </Box>
        {children}
      </Container>
    </ThemeProvider>
  );
};

export default Layout;
