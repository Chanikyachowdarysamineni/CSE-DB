import React, { useEffect, useState, useContext } from 'react';
import { Snackbar, Alert, Badge } from '@mui/material';
import { UserContext } from '../App';

// Component to check and notify about upcoming deadlines
const DeadlineNotifier = () => {
  const { user } = useContext(UserContext);
  const [notification, setNotification] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user && user.role === 'Student') {
      // Check for deadlines every 5 minutes
      const checkDeadlines = () => {
        fetch('/api/deadlines/upcoming', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            // Check for deadlines within 3 days
            const urgentDeadlines = data.filter(d => {
              const daysLeft = Math.ceil((new Date(d.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
              return daysLeft > 0 && daysLeft <= 3;
            });

            if (urgentDeadlines.length > 0) {
              const deadline = urgentDeadlines[0];
              const daysLeft = Math.ceil((new Date(deadline.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
              
              setNotification({
                message: `Reminder: "${deadline.title}" (${deadline.subjectCode}) is due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
                severity: daysLeft <= 1 ? 'error' : 'warning'
              });
              setOpen(true);

              // Play notification sound
              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => console.log('Audio play failed:', e));
            }
          })
          .catch(error => {
            console.log('Error fetching deadlines:', error);
            // Use mock data for development
            const mockDeadlines = [
              { id: 1, title: 'Database Assignment 3', subjectCode: 'CSE401', dueDate: '2025-12-02' },
              { id: 2, title: 'AI Project Submission', subjectCode: 'CSE502', dueDate: '2025-12-01' }
            ];
            
            const urgentDeadlines = mockDeadlines.filter(d => {
              const daysLeft = Math.ceil((new Date(d.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
              return daysLeft > 0 && daysLeft <= 3;
            });

            if (urgentDeadlines.length > 0) {
              const deadline = urgentDeadlines[0];
              const daysLeft = Math.ceil((new Date(deadline.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
              
              setNotification({
                message: `Reminder: "${deadline.title}" (${deadline.subjectCode}) is due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
                severity: daysLeft <= 1 ? 'error' : 'warning'
              });
              setOpen(true);
            }
          });
      };

      // Check immediately on mount
      checkDeadlines();

      // Then check every 5 minutes
      const interval = setInterval(checkDeadlines, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  if (!notification) return null;

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={10000} 
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default DeadlineNotifier;
