import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationAlert = () => {
  const { notifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [queue, setQueue] = useState([]);
  const navigate = useNavigate();

  // Monitor new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      
      // Check if this is a new notification (within last 5 seconds)
      const notificationTime = new Date(latestNotification.timestamp || latestNotification.created_at);
      const now = new Date();
      const isNew = (now - notificationTime) < 5000;

      if (isNew && !latestNotification.read) {
        setQueue(prev => {
          // Avoid duplicates
          const isDuplicate = prev.some(n => n.id === latestNotification.id || n._id === latestNotification._id);
          if (isDuplicate) return prev;
          return [...prev, latestNotification];
        });
      }
    }
  }, [notifications]);

  // Process queue
  useEffect(() => {
    if (queue.length > 0 && !currentNotification) {
      setCurrentNotification(queue[0]);
      setQueue(prev => prev.slice(1));
      setOpen(true);
    }
  }, [queue, currentNotification]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleExited = () => {
    setCurrentNotification(null);
  };

  const handleClick = () => {
    if (currentNotification?.link) {
      navigate(currentNotification.link);
      setOpen(false);
    }
  };

  if (!currentNotification) return null;

  const getSeverity = () => {
    if (currentNotification.priority === 'high') return 'error';
    if (currentNotification.priority === 'medium') return 'warning';
    if (currentNotification.type === 'success') return 'success';
    return 'info';
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }}
    >
      <Alert
        onClose={handleClose}
        severity={getSeverity()}
        variant="filled"
        sx={{ 
          width: '100%',
          cursor: currentNotification.link ? 'pointer' : 'default',
          '&:hover': currentNotification.link ? { opacity: 0.9 } : {}
        }}
        onClick={handleClick}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <strong>{currentNotification.title}</strong>
        <br />
        {currentNotification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationAlert;
