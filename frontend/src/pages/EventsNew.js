import React, { useState, useContext } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, CardMedia, Button, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Stack, IconButton, Menu, MenuItem
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventIcon from '@mui/icons-material/Event';
import GoogleIcon from '@mui/icons-material/Google';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WorkshopIcon from '@mui/icons-material/Engineering';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import { UserContext } from '../App';
import fetchWithAuth from '../utils/api';

const getEventTypeColor = (type) => {
  switch(type) {
    case 'Workshop': return '#667eea';
    case 'Exam': return '#ef4444';
    case 'Seminar': return '#10b981';
    case 'Competition': return '#f59e0b';
    default: return '#667eea';
  }
};

const getEventIcon = (type) => {
  switch(type) {
    case 'Workshop': return <WorkshopIcon />;
    case 'Exam': return <SchoolIcon />;
    case 'Seminar': return <EventIcon />;
    case 'Competition': return <CodeIcon />;
    default: return <EventIcon />;
  }
};

const Events = () => {
  const { user } = useContext(UserContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch events from database
  React.useEffect(() => {
    fetchWithAuth('/api/events')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
      })
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

  // Calendar navigation
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleSetReminder = (event, calendarType) => {
    alert(`Setting reminder in ${calendarType} for: ${event.title}`);
    setReminderDialogOpen(false);
  };

  const handleExportICS = (event) => {
    // Create .ics file content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CSE Department//Events//EN
BEGIN:VEVENT
UID:${event._id || event.id}@cse-portal
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.venue}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setReminderDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Events
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={3}>
        Workshops, exams, and seminars
      </Typography>

      <Grid container spacing={3}>
        {/* Calendar View */}
        <Grid item xs={12} md={7}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={handlePrevMonth} sx={{ textTransform: 'none' }}>
                    Prev
                  </Button>
                  <Button size="small" onClick={handleNextMonth} sx={{ textTransform: 'none' }}>
                    Next
                  </Button>
                </Stack>
              </Box>

              {/* Calendar Grid */}
              <Box>
                <Grid container spacing={1}>
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                    <Grid item xs={12/7} key={day}>
                      <Typography 
                        variant="caption" 
                        fontWeight={600} 
                        color="textSecondary"
                        textAlign="center"
                        display="block"
                      >
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>

                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  {/* Empty cells for days before month starts */}
                  {[...Array(firstDay)].map((_, idx) => (
                    <Grid item xs={12/7} key={`empty-${idx}`}>
                      <Box sx={{ height: 60 }} />
                    </Grid>
                  ))}
                  
                  {/* Calendar days */}
                  {[...Array(daysInMonth)].map((_, idx) => {
                    const day = idx + 1;
                    const isToday = day === new Date().getDate() && 
                                   currentMonth.getMonth() === new Date().getMonth();
                    return (
                      <Grid item xs={12/7} key={day}>
                        <Box
                          sx={{
                            height: 60,
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            p: 0.5,
                            bgcolor: isToday ? '#e3e8ff' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: '#f5f5f5',
                              borderColor: '#667eea'
                            }
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight={isToday ? 700 : 500}
                            color={isToday ? 'primary' : 'inherit'}
                          >
                            {day}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Events Sidebar */}
        <Grid item xs={12} md={5}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Upcoming Events
              </Typography>
              
              <Stack spacing={2}>
                {loading ? (
                  <Typography variant="body2" color="textSecondary">Loading events...</Typography>
                ) : events.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">No upcoming events</Typography>
                ) : (
                  events.slice(0, 3).map((event) => (
                  <Card 
                    key={event._id || event.id}
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(102,126,234,0.15)',
                        borderColor: '#667eea'
                      }
                    }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" gap={1.5}>
                        <Avatar 
                          sx={{ 
                            bgcolor: getEventTypeColor(event.type),
                            width: 40,
                            height: 40
                          }}
                        >
                          {getEventIcon(event.type)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={600} mb={0.5}>
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
                            {new Date(event.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </Typography>
                          <Chip 
                            label={event.type} 
                            size="small" 
                            sx={{ 
                              bgcolor: getEventTypeColor(event.type),
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                )))
                }
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Event Cards */}
        {loading ? (
          <Grid item xs={12}>
            <Typography>Loading events...</Typography>
          </Grid>
        ) : events.length === 0 ? (
          <Grid item xs={12}>
            <Typography>No events available</Typography>
          </Grid>
        ) : (
          events.map((event) => (
          <Grid item xs={12} md={6} lg={4} key={event._id || event.id}>
            <Card 
              sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardMedia
                component="img"
                height="180"
                image={event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                alt={event.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Chip 
                    label={event.type}
                    size="small"
                    sx={{ 
                      bgcolor: getEventTypeColor(event.type),
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                      setSelectedEvent(event);
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography variant="h6" fontWeight={600} mb={1}>
                  {event.title}
                </Typography>

                <Typography variant="body2" color="textSecondary" mb={2} sx={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {event.description}
                </Typography>

                <Stack spacing={1} mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarTodayIcon sx={{ fontSize: 16, color: '#667eea' }} />
                    <Typography variant="caption">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTimeIcon sx={{ fontSize: 16, color: '#667eea' }} />
                    <Typography variant="caption">{event.time || 'TBA'}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOnIcon sx={{ fontSize: 16, color: '#667eea' }} />
                    <Typography variant="caption">{event.venue}</Typography>
                  </Box>
                </Stack>

                <Box 
                  sx={{ 
                    bgcolor: '#f8f9ff', 
                    p: 1.5, 
                    borderRadius: 1,
                    mb: 2
                  }}
                >
                  <Typography variant="caption" color="textSecondary">
                    Registrations
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {event.attendees || 0} / {event.capacity || 50}
                  </Typography>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 4, 
                      bgcolor: '#e0e0e0', 
                      borderRadius: 2,
                      mt: 1
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${((event.attendees || 0) / (event.capacity || 50)) * 100}%`,
                        height: '100%',
                        bgcolor: '#667eea',
                        borderRadius: 2
                      }}
                    />
                  </Box>
                </Box>

                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={<NotificationsActiveIcon />}
                  onClick={() => {
                    setSelectedEvent(event);
                    setReminderDialogOpen(true);
                  }}
                  sx={{ 
                    textTransform: 'none',
                    bgcolor: '#667eea',
                    '&:hover': { bgcolor: '#5568d3' }
                  }}
                >
                  Set Reminder
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )))
        }
      </Grid>

      {/* Event Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setReminderDialogOpen(true);
          setAnchorEl(null);
        }}>
          <NotificationsActiveIcon fontSize="small" sx={{ mr: 1 }} />
          Set Reminder
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedEvent) handleExportICS(selectedEvent);
          setAnchorEl(null);
        }}>
          <EventIcon fontSize="small" sx={{ mr: 1 }} />
          Export to Calendar
        </MenuItem>
      </Menu>

      {/* Reminder Dialog */}
      <Dialog 
        open={reminderDialogOpen} 
        onClose={() => setReminderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Set Reminder in Calendar
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedEvent?.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<GoogleIcon />}
              fullWidth
              onClick={() => handleSetReminder(selectedEvent, 'Google Calendar')}
              sx={{ 
                textTransform: 'none',
                justifyContent: 'flex-start',
                p: 2
              }}
            >
              Google Calendar
            </Button>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              fullWidth
              onClick={() => handleSetReminder(selectedEvent, 'Outlook')}
              sx={{ 
                textTransform: 'none',
                justifyContent: 'flex-start',
                p: 2
              }}
            >
              Outlook Calendar
            </Button>
            <Button
              variant="outlined"
              startIcon={<CalendarTodayIcon />}
              fullWidth
              onClick={() => handleSetReminder(selectedEvent, 'Apple Calendar')}
              sx={{ 
                textTransform: 'none',
                justifyContent: 'flex-start',
                p: 2
              }}
            >
              Apple Calendar (iCal)
            </Button>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              fullWidth
              onClick={() => selectedEvent && handleExportICS(selectedEvent)}
              sx={{ 
                textTransform: 'none',
                justifyContent: 'flex-start',
                p: 2
              }}
            >
              Download .ics File
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setReminderDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Events;
