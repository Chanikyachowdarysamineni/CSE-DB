import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Card, CardContent, Button, Grid, Chip, Alert } from '@mui/material';
import { CalendarMonth as CalendarIcon, Event as EventIcon } from '@mui/icons-material';
import { UserContext } from '../App';

const GoogleCalendarView = () => {
  const { user } = useContext(UserContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState('list'); // 'list' or 'calendar'

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch('/api/events', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(error => {
        console.log('Error fetching events:', error);
        // Use mock data
        const mockEvents = [
          { 
            id: 1, 
            title: 'AI Workshop', 
            date: '2025-12-05T10:00:00', 
            endDate: '2025-12-05T16:00:00',
            type: 'Workshop', 
            venue: 'Hall A',
            description: 'Introduction to AI and Machine Learning',
            created_by: 'Faculty'
          },
          { 
            id: 2, 
            title: 'Tech Fest', 
            date: '2025-12-20T09:00:00',
            endDate: '2025-12-20T18:00:00',
            type: 'Department Event', 
            venue: 'Campus Ground',
            description: 'Annual technology festival',
            created_by: 'HOD'
          },
          { 
            id: 3, 
            title: 'Project Submission Deadline', 
            date: '2025-12-10T23:59:00',
            endDate: '2025-12-10T23:59:00',
            type: 'Deadline', 
            venue: 'Online',
            description: 'Final project submission for CSE502',
            created_by: 'DEAN'
          },
        ];
        setEvents(mockEvents);
        setLoading(false);
      });
  };

  const addToGoogleCalendar = (event) => {
    const startDate = new Date(event.date).toISOString().replace(/-|:|\\.\\d\\d\\d/g, '');
    const endDate = new Date(event.endDate || event.date).toISOString().replace(/-|:|\\.\\d\\d\\d/g, '');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.venue || '')}`;
    window.open(googleCalendarUrl, '_blank');
  };

  const openGoogleCalendar = () => {
    // Open Google Calendar with all events
    window.open('https://calendar.google.com/', '_blank');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntil = (dateString) => {
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getEventColor = (type) => {
    switch(type) {
      case 'Workshop': return 'primary';
      case 'Seminar': return 'secondary';
      case 'Department Event': return 'success';
      case 'Deadline': return 'error';
      case 'Hackathon': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading events...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Events Calendar
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            onClick={openGoogleCalendar}
            sx={{ mr: 1 }}
          >
            Open Google Calendar
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setCalendarView(calendarView === 'list' ? 'calendar' : 'list')}
          >
            {calendarView === 'list' ? 'Calendar View' : 'List View'}
          </Button>
        </Box>
      </Box>

      {user && user.role === 'Student' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You can view all upcoming events and add them to your Google Calendar. 
          Click on "Add to Calendar" to sync any event with your personal calendar.
        </Alert>
      )}

      <Grid container spacing={3}>
        {events
          .filter(e => new Date(e.date) >= new Date()) // Only show future events
          .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date
          .map(event => {
            const daysUntil = getDaysUntil(event.date);
            return (
              <Grid item xs={12} md={6} key={event.id}>
                <Card elevation={3} sx={{ borderRadius: 3, borderLeft: `5px solid`, borderColor: `${getEventColor(event.type)}.main` }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" fontWeight={600}>
                        {event.title}
                      </Typography>
                      <Chip 
                        label={event.type} 
                        color={getEventColor(event.type)} 
                        size="small" 
                      />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      <EventIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      {formatDate(event.date)}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Venue:</strong> {event.venue}
                    </Typography>
                    
                    {event.description && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {event.description}
                      </Typography>
                    )}
                    
                    <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                      {daysUntil <= 7 && daysUntil > 0 && (
                        <Chip 
                          label={`In ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                          color={daysUntil <= 3 ? 'error' : 'warning'}
                          size="small"
                        />
                      )}
                      {daysUntil === 0 && (
                        <Chip label="Today!" color="error" size="small" />
                      )}
                      
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => addToGoogleCalendar(event)}
                      >
                        Add to Calendar
                      </Button>
                      
                      <Button variant="text" size="small">
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
      </Grid>

      {events.filter(e => new Date(e.date) >= new Date()).length === 0 && (
        <Card elevation={2} sx={{ mt: 3, p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No upcoming events scheduled
          </Typography>
        </Card>
      )}

      {/* Embedded Google Calendar iframe (optional) */}
      {calendarView === 'calendar' && (
        <Card elevation={3} sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>Integrated Calendar View</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Note: To fully integrate Google Calendar, you'll need to set up Google Calendar API credentials.
          </Typography>
          <Box sx={{ width: '100%', height: 600, border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden' }}>
            <iframe 
              src="https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23ffffff"
              style={{ border: 0 }}
              width="100%" 
              height="600" 
              frameBorder="0" 
              scrolling="no"
              title="Google Calendar"
            ></iframe>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default GoogleCalendarView;
