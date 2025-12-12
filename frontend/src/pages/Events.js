
import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Fade, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Snackbar, Alert } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { UserContext } from '../App';
import GoogleCalendarView from '../components/GoogleCalendarView';
import { broadcastContentNotification } from '../utils/notificationBroadcast';
import { useSocket } from '../contexts/SocketContext';
import fetchWithAuth from '../utils/api';

const Events = () => {
  const { user } = React.useContext(UserContext);
  const { on, off, connected, emit } = useSocket();
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('All');
  const types = ['All', 'Seminar', 'Hackathon', 'Workshop', 'Deadline', 'Department Event'];
    const [postType, setPostType] = React.useState('');
    const postTypes = ['All', 'Announcement', 'Event', 'Assignment', 'Project', 'Forum'];
  const [sortBy, setSortBy] = React.useState('date');
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [realtimeNotification, setRealtimeNotification] = React.useState({ open: false, message: '' });
  const [newEvent, setNewEvent] = React.useState({ 
    title: '', 
    date: '', 
    expiryDate: '', 
    type: 'Department Event',
    description: '',
    venue: '',
    subjectName: '',
    subjectCode: '',
    capacity: 50,
    recurring: false,
    addToGoogleCalendar: false
  });

  // Fetch events from database
  React.useEffect(() => {
    fetchWithAuth('/api/events')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
        setEvents([]);
        setLoading(false);
      });
  }, []);

  // Real-time event listeners
  React.useEffect(() => {
    if (!connected) return;

    const handleNewEvent = (event) => {
      setEvents(prev => [event, ...prev]);
      setRealtimeNotification({ open: true, message: `📅 New event: ${event.title}` });
    };

    on('event:new', handleNewEvent);

    return () => {
      off('event:new', handleNewEvent);
    };
  }, [connected, on, off]);
  
  // Permission checks - Faculty/HOD/DEAN have full access
  const canCreate = user && ['HOD', 'DEAN', 'Faculty'].includes(user.role);
  const canEdit = (event) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return event.created_by === user.id;
    return false;
  };
  const canDelete = (event) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return event.created_by === user.id;
    return false;
  };
  
  const filtered = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = type === 'All' || (type === 'Seminar' && e.title.toLowerCase().includes('seminar')) || (type === 'Hackathon' && e.title.toLowerCase().includes('hackathon')) || (type === 'Recurring' && e.recurring);
    
    // Students only see approved events
    if (user?.role === 'Student') {
      return matchesSearch && matchesType && e.status === 'approved';
    }
    
    // Faculty see their own events and approved events
    if (user?.role === 'Faculty') {
      return matchesSearch && matchesType && (e.created_by === user?.id || e.status === 'approved');
    }
    
    // HOD and DEAN see all events
    return matchesSearch && matchesType;
  });

  // Sort events
  const sorted = React.useMemo(() => {
    let result = [...filtered];
    switch(sortBy) {
      case 'date':
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'capacity':
        result.sort((a, b) => (b.capacity - b.attendees) - (a.capacity - a.attendees));
        break;
      case 'type':
        result.sort((a, b) => (a.type || a.title).localeCompare(b.type || b.title));
        break;
      default:
        break;
    }
    return result;
  }, [filtered, sortBy]);

  const handleCreateEvent = async () => {
    try {
      // Google Calendar integration
      let googleCalendarLink = '';
      if (newEvent.addToGoogleCalendar) {
        const startDate = new Date(newEvent.date).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const endDate = new Date(new Date(newEvent.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
        googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(newEvent.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(newEvent.description)}&location=${encodeURIComponent(newEvent.venue)}`;
        window.open(googleCalendarLink, '_blank');
      }
      
      const response = await fetchWithAuth('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          date: newEvent.date,
          venue: newEvent.venue,
          capacity: newEvent.capacity,
          recurring: newEvent.recurring,
          google_calendar_link: googleCalendarLink,
          subject_name: newEvent.subjectName,
          subject_code: newEvent.subjectCode
        })
      });

      if (response.ok) {
        const createdEvent = await response.json();
        setEvents(prev => [createdEvent, ...prev]);
        setRealtimeNotification({ open: true, message: '✅ Event created successfully' });
        
        // Emit socket event
        if (connected) {
          emit('event:new', createdEvent);
        }
        
        // Broadcast notification to students
        broadcastContentNotification({
          type: 'Event',
          title: newEvent.title,
          message: `${newEvent.description || 'New event scheduled'} - ${newEvent.venue}`,
          contentId: createdEvent._id,
          priority: 'medium'
        });
        
        setOpenCreateDialog(false);
        setNewEvent({ 
          title: '', 
          date: '', 
          expiryDate: '', 
          type: 'Department Event',
          description: '',
          venue: '',
          subjectName: '',
          subjectCode: '',
          capacity: 50,
          recurring: false,
          addToGoogleCalendar: false
        });
      } else {
        setRealtimeNotification({ open: true, message: '❌ Failed to create event' });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setRealtimeNotification({ open: true, message: '❌ Error creating event' });
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const response = await fetchWithAuth(`/api/events/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEvents(prev => prev.filter(e => e._id !== id && e.id !== id));
        setRealtimeNotification({ open: true, message: '✅ Event deleted successfully' });
      } else {
        setRealtimeNotification({ open: true, message: '❌ Failed to delete event' });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setRealtimeNotification({ open: true, message: '❌ Error deleting event' });
    }
  };

  const handleRSVP = (eventId) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        if (e.attendees < e.capacity) {
          return { ...e, attendees: e.attendees + 1, rsvp: true };
        }
      }
      return e;
    }));
  };

  const handleJoinWaitlist = (eventId) => {
    if (!user) return;
    setEvents(events.map(e => {
      if (e.id === eventId) {
        if (!e.waitlist.includes(user.id)) {
          return { ...e, waitlist: [...e.waitlist, user.id] };
        }
      }
      return e;
    }));
  };

  const handleLeaveWaitlist = (eventId) => {
    if (!user) return;
    setEvents(events.map(e => {
      if (e.id === eventId) {
        return { ...e, waitlist: e.waitlist.filter(id => id !== user.id) };
      }
      return e;
    }));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>📅 Events</Typography>
          <Typography variant="body2" color="text.secondary">Workshops, seminars, and department activities</Typography>
        </Box>
        {canCreate && (
          <Button 
            variant="contained" 
            color="warning" 
            onClick={() => setOpenCreateDialog(true)}
            sx={{ 
              borderRadius: 2, 
              px: 3, 
              py: 1.5, 
              fontWeight: 600,
              boxShadow: 3,
              '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
              transition: '0.3s'
            }}
          >
            + Schedule Event
          </Button>
        )}
      </Box>

      {/* Tabs for List View and Calendar View */}
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="List View" />
        <Tab label="Calendar View" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
      <>
      {tabValue === 0 && (
        <>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField label="Search" variant="outlined" value={search} onChange={e => setSearch(e.target.value)} sx={{ width: '100%', maxWidth: 400 }} />
        <TextField select label="Type" value={type} onChange={e => setType(e.target.value)} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </TextField>
        <TextField select label="Post Type" value={postType} onChange={e => setPostType(e.target.value)} sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
          {postTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
        </TextField>
      </Box>
      <Box mb={3}>
        <Card elevation={2} sx={{ borderRadius: 2, p: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <CalendarMonthIcon color="primary" fontSize="large" />
            <Typography variant="h6">Upcoming Events Calendar</Typography>
          </Box>
          <Box mt={2} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {sorted.map(e => (
              <Chip key={e.id} label={`${e.title} (${e.date})`} color="info" sx={{ fontWeight: 600 }} />
            ))}
          </Box>
        </Card>
      </Box>
      <Grid container spacing={3}>
        {sorted.map(e => (
          <Grid item xs={12} sm={12} md={6} key={e.id}>
            <Fade in timeout={700}>
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6">{e.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, mb: 2 }}>
                    <Chip label={e.date} color="info" size="small" />
                    {e.recurring && <Chip label="Recurring" color="warning" size="small" />}
                    {e.reminder && <Chip label="Reminder Set" color="success" size="small" />}
                  </Box>
                  
                  {/* Capacity and Waitlist Info */}
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Capacity: {e.attendees}/{e.capacity}
                    </Typography>
                    {e.attendees >= e.capacity && (
                      <Chip 
                        label="Event Full" 
                        color="error" 
                        size="small" 
                        sx={{ mt: 0.5 }}
                      />
                    )}
                    {e.waitlist && e.waitlist.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Waitlist: {e.waitlist.length} {e.waitlist.length === 1 ? 'person' : 'people'}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                    {e.attendees < e.capacity ? (
                      <Button 
                        variant="contained" 
                        color={e.rsvp ? 'secondary' : 'primary'}
                        onClick={() => handleRSVP(e.id)}
                        disabled={e.rsvp}
                      >
                        {e.rsvp ? 'RSVPed' : 'RSVP'}
                      </Button>
                    ) : (
                      <>
                        {user && e.waitlist && e.waitlist.includes(user.id) ? (
                          <Button 
                            variant="outlined" 
                            color="warning"
                            onClick={() => handleLeaveWaitlist(e.id)}
                          >
                            Leave Waitlist
                          </Button>
                        ) : (
                          <Button 
                            variant="contained" 
                            color="warning"
                            onClick={() => handleJoinWaitlist(e.id)}
                          >
                            Join Waitlist
                          </Button>
                        )}
                      </>
                    )}
                    {canDelete && (
                      <Button variant="outlined" color="error" onClick={() => handleDeleteEvent(e.id)}>
                        Delete
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>
        </>
      )}

      {tabValue === 1 && (
        <GoogleCalendarView />
      )}
      </>
      )}

      {/* Create Event Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <TextField
            label="Event Title"
            fullWidth
            required
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            margin="normal"
          />
          <TextField
            label="Subject Name"
            fullWidth
            required
            value={newEvent.subjectName}
            onChange={(e) => setNewEvent({ ...newEvent, subjectName: e.target.value })}
            margin="normal"
            placeholder="e.g., Database Management Systems"
          />
          <TextField
            label="Subject Code"
            fullWidth
            required
            value={newEvent.subjectCode}
            onChange={(e) => setNewEvent({ ...newEvent, subjectCode: e.target.value })}
            margin="normal"
            placeholder="e.g., CSE401"
          />
          <TextField
            select
            label="Event Type"
            fullWidth
            value={newEvent.type}
            onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="Department Event">Department Event</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Deadline">Deadline</option>
            <option value="Hackathon">Hackathon</option>
          </TextField>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            margin="normal"
          />
          <TextField
            label="Venue"
            fullWidth
            value={newEvent.venue}
            onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
            margin="normal"
          />
          <TextField
            label="Capacity"
            type="number"
            fullWidth
            value={newEvent.capacity}
            onChange={(e) => setNewEvent({ ...newEvent, capacity: parseInt(e.target.value) || 0 })}
            margin="normal"
            helperText="Maximum number of attendees (waitlist will be enabled when full)"
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Event Date"
            type="datetime-local"
            fullWidth
            required
            value={newEvent.date}
            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Expiry Date"
            type="date"
            fullWidth
            value={newEvent.expiryDate}
            onChange={(e) => setNewEvent({ ...newEvent, expiryDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            helperText="Date after which this event will not be displayed"
          />
          <TextField
            select
            label="Recurring"
            fullWidth
            value={newEvent.recurring}
            onChange={(e) => setNewEvent({ ...newEvent, recurring: e.target.value === 'true' })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </TextField>
          <Box mt={2} display="flex" alignItems="center">
            <input
              type="checkbox"
              checked={newEvent.addToGoogleCalendar}
              onChange={(e) => setNewEvent({ ...newEvent, addToGoogleCalendar: e.target.checked })}
              id="google-calendar-checkbox"
            />
            <label htmlFor="google-calendar-checkbox" style={{ marginLeft: 8 }}>
              Add to Google Calendar
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateEvent} variant="contained" color="primary">
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={realtimeNotification.open}
        autoHideDuration={4000}
        onClose={() => setRealtimeNotification({ ...realtimeNotification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setRealtimeNotification({ ...realtimeNotification, open: false })} 
          severity="info"
          sx={{ width: '100%' }}
        >
          {realtimeNotification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Events;
