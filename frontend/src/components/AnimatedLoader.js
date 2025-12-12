import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const AnimatedLoader = ({ text = 'Loading...' }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="40vh">
    <CircularProgress color="primary" size={60} thickness={5} />
    <Typography variant="h6" mt={2} sx={{ animation: 'fadeIn 1s' }}>{text}</Typography>
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
  </Box>
);

export default AnimatedLoader;
