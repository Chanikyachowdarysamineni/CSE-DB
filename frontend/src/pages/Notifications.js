


import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Fade, Switch, FormControlLabel, Chip, TextField, MenuItem, Tabs, Tab, Divider, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const channels = ['All', 'In-app', 'Email', 'SMS'];
const priorities = ['All', 'High', 'Medium', 'Low'];

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const navigate = useNavigate();
  const [dnd, setDnd] = useState(false);
  const [channel, setChannel] = useState('All');
  const [priority, setPriority] = useState('All');
  const [tabValue, setTabValue] = useState(0);
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    sms: false,
    emailDigest: 'daily',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });
  const [openPreferences, setOpenPreferences] = useState(false);

  const filtered = notifications.filter(n =>
    (channel === 'All' || n.channel === channel) &&
    (priority === 'All' || n.priority === priority)
  );

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return time.toLocaleString();
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} mb={0.5}>
            Notifications Center
          </Typography>
          {notifications.filter(n => !n.read).length > 0 && (
            <Chip 
              label={`${notifications.filter(n => !n.read).length} Unread`} 
              color="error" 
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
        <Box display="flex" gap={1}>
          {notifications.filter(n => !n.read).length > 0 && (
            <Button 
              variant="contained" 
              startIcon={<DoneAllIcon />} 
              onClick={markAllAsRead}
              sx={{ 
                textTransform: 'none',
                bgcolor: '#667eea',
                '&:hover': { bgcolor: '#5568d3' }
              }}
            >
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<ClearAllIcon />} 
              onClick={clearAll}
              sx={{ textTransform: 'none' }}
            >
              Clear All
            </Button>
          )}
          <Button 
            variant="outlined" 
            startIcon={<NotificationsActiveIcon />} 
            onClick={() => setOpenPreferences(true)}
            sx={{ textTransform: 'none' }}
          >
            Preferences
          </Button>
        </Box>
      </Box>
      
      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <FormControlLabel 
          control={<Switch checked={dnd} onChange={e => setDnd(e.target.checked)} />} 
          label="Do Not Disturb" 
        />
        <TextField select label="Channel" value={channel} onChange={e => setChannel(e.target.value)} sx={{ minWidth: 140 }}>
          {channels.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField select label="Priority" value={priority} onChange={e => setPriority(e.target.value)} sx={{ minWidth: 140 }}>
          {priorities.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </TextField>
      </Box>

      <Tabs 
        value={tabValue} 
        onChange={(e, v) => setTabValue(v)} 
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem'
          }
        }}
      >
        <Tab label={`All (${notifications.length})`} />
        <Tab label={`Unread (${notifications.filter(n => !n.read).length})`} />
      </Tabs>

      {notifications.length === 0 ? (
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsActiveIcon sx={{ fontSize: 80, color: '#667eea', mb: 2 }} />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You'll receive notifications when Faculty, HOD, or DEAN post new content
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filtered
            .filter(n => tabValue === 0 || !n.read)
            .map(n => (
            <Grid item xs={12} key={n.id}>
              <Card 
                sx={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  bgcolor: n.read ? '#f9f9f9' : 'white',
                  borderLeft: '4px solid',
                  borderLeftColor: n.read 
                    ? '#e0e0e0' 
                    : n.priority === 'high' 
                      ? '#ef4444' 
                      : n.priority === 'medium' 
                        ? '#f59e0b' 
                        : '#667eea',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    boxShadow: '0 4px 12px rgba(102,126,234,0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => handleNotificationClick(n)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                          <Typography 
                            variant="h6" 
                            fontWeight={n.read ? 500 : 700}
                            sx={{ color: n.read ? 'text.secondary' : 'text.primary' }}
                          >
                            {n.title}
                          </Typography>
                          {!n.read && (
                            <Chip 
                              label="NEW" 
                              size="small"
                              sx={{ 
                                bgcolor: '#ef4444',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 22
                              }}
                            />
                          )}
                        </Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            mb: 2,
                            color: n.read ? 'text.secondary' : 'text.primary',
                            fontWeight: n.read ? 400 : 500
                          }}
                        >
                          {n.message}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                          <Chip 
                            label={n.type} 
                            size="small" 
                            sx={{
                              bgcolor: n.priority === 'high' 
                                ? '#fee2e2' 
                                : n.priority === 'medium' 
                                  ? '#fef3c7' 
                                  : '#e3e8ff',
                              color: n.priority === 'high' 
                                ? '#ef4444' 
                                : n.priority === 'medium' 
                                  ? '#f59e0b' 
                                  : '#667eea',
                              fontWeight: 600
                            }}
                          />
                          <Chip 
                            label={n.channel} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {getTimeAgo(n.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        sx={{ ml: 2 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Notification Preferences Dialog */}
      <Dialog open={openPreferences} onClose={() => setOpenPreferences(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Preferences</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Channels</Typography>
          <FormControlLabel
            control={<Switch checked={preferences.email} onChange={(e) => setPreferences({...preferences, email: e.target.checked})} />}
            label={<Box display="flex" alignItems="center"><EmailIcon sx={{ mr: 1 }} /> Email Notifications</Box>}
          />
          <FormControlLabel
            control={<Switch checked={preferences.push} onChange={(e) => setPreferences({...preferences, push: e.target.checked})} />}
            label="Push Notifications"
          />
          <FormControlLabel
            control={<Switch checked={preferences.sms} onChange={(e) => setPreferences({...preferences, sms: e.target.checked})} />}
            label="SMS Notifications"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>Email Digest</Typography>
          <TextField
            select
            fullWidth
            label="Frequency"
            value={preferences.emailDigest}
            onChange={(e) => setPreferences({...preferences, emailDigest: e.target.value})}
            sx={{ mb: 2 }}
          >
            <MenuItem value="instant">Instant</MenuItem>
            <MenuItem value="hourly">Hourly</MenuItem>
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
          </TextField>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon sx={{ mr: 1 }} /> Quiet Hours
          </Typography>
          <TextField
            fullWidth
            label="Start Time"
            type="time"
            value={preferences.quietHoursStart}
            onChange={(e) => setPreferences({...preferences, quietHoursStart: e.target.value})}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="End Time"
            type="time"
            value={preferences.quietHoursEnd}
            onChange={(e) => setPreferences({...preferences, quietHoursEnd: e.target.value})}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreferences(false)}>Cancel</Button>
          <Button onClick={() => {
            console.log('Saving preferences:', preferences);
            setOpenPreferences(false);
          }} variant="contained">
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;
