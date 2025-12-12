
import React from 'react';
import { Grid, Card, CardContent, Typography, Button, Fade, Box, Alert, Chip, Divider, List, ListItem, ListItemText, ListItemIcon, IconButton, Badge, Menu, MenuItem } from '@mui/material';
import { useContext } from 'react';
import { UserContext } from '../App';
import { Link } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import FolderIcon from '@mui/icons-material/Folder';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import PushPinIcon from '@mui/icons-material/PushPin';
import fetchWithAuth from '../utils/api';

const Dashboard = () => {
  const user = useContext(UserContext);
  const role = user?.role || 'Student';
  const [upcomingDeadlines, setUpcomingDeadlines] = React.useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = React.useState([]);
  const [urgentReminders, setUrgentReminders] = React.useState([]);
  const [notificationAnchor, setNotificationAnchor] = React.useState(null);
  const [unreadCount, setUnreadCount] = React.useState(5);
  const [pinnedAnnouncements, setPinnedAnnouncements] = React.useState([]);
  const [submissions, setSubmissions] = React.useState([]);

  React.useEffect(() => {
    // Fetch upcoming deadlines from all sources
    fetchUpcomingDeadlines();
    fetchRecentAnnouncements();
    fetchPinnedAnnouncements();
    if (role === 'Student') {
      fetchMySubmissions();
    }
  }, [role]);

  React.useEffect(() => {
    // Check for urgent reminders whenever deadlines update
    checkUrgentReminders();
  }, [upcomingDeadlines]);

  const fetchUpcomingDeadlines = async () => {
    try {
      const now = new Date();
      const deadlines = [];

      // Fetch assignments with deadlines
      const assignmentsRes = await fetchWithAuth('/api/assignments');
      if (assignmentsRes.ok) {
        const assignments = await assignmentsRes.json();
        assignments
          .filter(a => a.deadline && new Date(a.deadline) > now && a.status === 'approved')
          .forEach(a => {
            const daysLeft = Math.ceil((new Date(a.deadline) - now) / (1000 * 60 * 60 * 24));
            deadlines.push({
              id: `assignment-${a._id || a.id}`,
              title: a.title,
              subject: a.subject_name,
              subjectCode: a.subject_code,
              dueDate: new Date(a.deadline).toLocaleDateString(),
              daysLeft: daysLeft,
              type: 'Assignment',
              urgent: daysLeft <= 3
            });
          });
      }

      // Fetch projects with deadlines
      const projectsRes = await fetchWithAuth('/api/projects');
      if (projectsRes.ok) {
        const projects = await projectsRes.json();
        projects
          .filter(p => p.due_date && new Date(p.due_date) > now)
          .forEach(p => {
            const daysLeft = Math.ceil((new Date(p.due_date) - now) / (1000 * 60 * 60 * 24));
            deadlines.push({
              id: `project-${p._id || p.id}`,
              title: p.title,
              subject: p.subject_name,
              subjectCode: p.subject_code,
              dueDate: new Date(p.due_date).toLocaleDateString(),
              daysLeft: daysLeft,
              type: 'Project',
              urgent: daysLeft <= 3
            });
          });
      }

      // Fetch forms with expiry dates
      const formsRes = await fetchWithAuth('/api/forms');
      if (formsRes.ok) {
        const forms = await formsRes.json();
        forms
          .filter(f => f.expiry_date && new Date(f.expiry_date) > now)
          .forEach(f => {
            const daysLeft = Math.ceil((new Date(f.deadline) - now) / (1000 * 60 * 60 * 24));
            deadlines.push({
              id: `form-${f._id || f.id}`,
              title: f.title,
              subject: f.subject_name,
              subjectCode: f.subject_code,
              dueDate: new Date(f.expiry_date).toLocaleDateString(),
              daysLeft: daysLeft,
              type: 'Form',
              urgent: daysLeft <= 3
            });
          });
      }

      // Fetch events
      const eventsRes = await fetchWithAuth('/api/events');
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        events
          .filter(e => e.date && new Date(e.date) > now)
          .forEach(e => {
            const daysLeft = Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24));
            deadlines.push({
              id: `event-${e._id || e.id}`,
              title: e.title,
              subject: e.subject_name || 'General',
              subjectCode: e.subject_code || 'EVENT',
              dueDate: new Date(e.date).toLocaleDateString(),
              daysLeft: daysLeft,
              type: 'Event',
              urgent: daysLeft <= 3
            });
          });
      }

      // Sort by urgency then by days left
      deadlines.sort((a, b) => {
        if (a.urgent !== b.urgent) return b.urgent ? 1 : -1;
        return a.daysLeft - b.daysLeft;
      });

      setUpcomingDeadlines(deadlines.slice(0, 10)); // Show top 10
    } catch (err) {
      console.warn('Failed to fetch deadlines, using mock data:', err);
      // Fallback to mock data
      const mockDeadlines = [
        { id: 1, title: 'Database Assignment 3', subject: 'DBMS', subjectCode: 'CSE401', dueDate: '2025-12-05', daysLeft: 6, type: 'Assignment', urgent: false },
        { id: 2, title: 'AI Project Submission', subject: 'Artificial Intelligence', subjectCode: 'CSE502', dueDate: '2025-12-10', daysLeft: 11, type: 'Project', urgent: false },
        { id: 3, title: 'Course Feedback Form', subject: 'Operating Systems', subjectCode: 'CSE403', dueDate: '2025-12-02', daysLeft: 3, type: 'Form', urgent: true },
      ];
      setUpcomingDeadlines(mockDeadlines);
    }
  };

  const fetchRecentAnnouncements = async () => {
    try {
      const res = await fetchWithAuth('/api/announcements');
      if (res.ok) {
        const announcements = await res.json();
        const recent = announcements
          .filter(a => a.status === 'approved')
          .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
          .slice(0, 5)
          .map(a => ({
            id: a._id || a.id,
            title: a.title,
            body: a.content || a.description,
            sender: a.created_by?.name || a.created_by?.role || 'Admin',
            date: new Date(a.created_at || a.createdAt).toLocaleDateString()
          }));
        setRecentAnnouncements(recent);
      }
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    }
  };

  const fetchPinnedAnnouncements = async () => {
    try {
      const res = await fetchWithAuth('/api/announcements');
      if (res.ok) {
        const announcements = await res.json();
        const pinned = announcements
          .filter(a => a.pinned && a.status === 'approved')
          .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
          .slice(0, 3)
          .map(a => ({
            id: a._id || a.id,
            title: a.title,
            priority: a.priority || 'High',
            date: new Date(a.created_at || a.createdAt).toLocaleDateString()
          }));
        setPinnedAnnouncements(pinned);
      }
    } catch (err) {
      console.warn('Failed to fetch pinned announcements:', err);
    }
  };

  const checkUrgentReminders = () => {
    // Check for deadlines within 3 days
    const urgent = upcomingDeadlines.filter(d => d.daysLeft <= 3 || d.urgent);
    setUrgentReminders(urgent);
  };

  const fetchMySubmissions = async () => {
    try {
      const res = await fetchWithAuth('/api/submissions/my');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.warn('Failed to fetch submissions:', err);
    }
  };

  const getSubmissionStatus = (assignmentId) => {
    const submission = submissions.find(s => s.assignment_id?._id === assignmentId || s.assignment_id === assignmentId);
    if (!submission) return null;
    return {
      submitted: true,
      is_late: submission.is_late,
      grade: submission.grade,
      submitted_at: submission.submitted_at
    };
  };
  const renderStudentDashboard = () => (
    <Box>
      {/* Urgent Reminders */}
      {urgentReminders.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="h6">Urgent: {urgentReminders.length} Deadline(s) Approaching!</Typography>
          {urgentReminders.map(reminder => (
            <Typography key={reminder.id} variant="body2">
              • {reminder.title} ({reminder.subjectCode}) - Due in {reminder.daysLeft} day(s)
            </Typography>
          ))}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notifications Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AnnouncementIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>Latest Announcements</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List>
                {recentAnnouncements.map(announcement => (
                  <ListItem key={announcement.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={announcement.title}
                      secondary={`${announcement.sender} • ${announcement.date}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Button component={Link} to="/announcements" variant="outlined" fullWidth>View All</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Deadlines */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AssignmentIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>Upcoming Deadlines</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List>
                {upcomingDeadlines.map(deadline => {
                  const submissionStatus = role === 'Student' && deadline.type === 'Assignment' 
                    ? getSubmissionStatus(deadline.id.replace('assignment-', ''))
                    : null;
                  
                  return (
                    <ListItem 
                      key={deadline.id} 
                      sx={{ 
                        px: 0, 
                        bgcolor: deadline.urgent && !submissionStatus ? 'error.light' : submissionStatus?.submitted ? 'success.light' : 'transparent', 
                        borderRadius: 1, 
                        mb: 0.5 
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography 
                              fontWeight={deadline.urgent && !submissionStatus ? 600 : 400}
                              sx={{ textDecoration: submissionStatus?.submitted ? 'line-through' : 'none' }}
                            >
                              {deadline.title}
                            </Typography>
                            {submissionStatus?.submitted && (
                              <Chip 
                                label={submissionStatus.grade || (submissionStatus.is_late ? 'Late' : 'Submitted')} 
                                size="small"
                                color={submissionStatus.grade ? 'success' : submissionStatus.is_late ? 'warning' : 'info'}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography component="span" variant="caption" color={deadline.urgent && !submissionStatus ? 'error.dark' : 'text.secondary'}>
                            {deadline.type} • {deadline.subjectCode} • Due: {deadline.dueDate}
                            {submissionStatus?.submitted && (
                              <> • Submitted: {new Date(submissionStatus.submitted_at).toLocaleDateString()}</>
                            )}
                          </Typography>
                        }
                      />
                      {!submissionStatus?.submitted && (
                        <Chip 
                          label={`${deadline.daysLeft}d left`} 
                          color={deadline.daysLeft <= 1 ? 'error' : deadline.daysLeft <= 3 ? 'warning' : 'default'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </ListItem>
                  );
                })}
              </List>
              <Button component={Link} to="/projects" variant="outlined" fullWidth>View All</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Resources */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <FolderIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>Academic Resources</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>Access notes, PDFs, and study materials</Typography>
              <Button component={Link} to="/resources" variant="contained" color="primary" fullWidth>
                Browse Resources
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* My Submissions */}
        {role === 'Student' && (
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssignmentIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>My Submissions</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" gap={2} mb={2}>
                  <Box flex={1}>
                    <Typography variant="h4" color="success.main" fontWeight={600}>
                      {submissions.filter(s => !s.is_late && s.grade).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Graded</Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h4" color="info.main" fontWeight={600}>
                      {submissions.filter(s => !s.grade).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Pending</Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h4" color="warning.main" fontWeight={600}>
                      {submissions.filter(s => s.is_late).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Late</Typography>
                  </Box>
                </Box>
                <Button component={Link} to="/academics" variant="contained" color="success" fullWidth>
                  View All Submissions
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Events & Calendar */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 3, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
            <CardContent>
              <EventIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>Events & Calendar</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>View upcoming events and workshops</Typography>
              <Button component={Link} to="/events" variant="contained" color="secondary" fullWidth>
                View Calendar
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Forms & Links */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <AssignmentIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>Forms & Links</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>Access Google Forms and submissions</Typography>
              <Button component={Link} to="/forms" variant="contained" color="success" fullWidth>
                Open Forms
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
  const renderFacultyDashboard = () => {
    const [myContent, setMyContent] = React.useState({
      announcements: 0,
      assignments: 0,
      resources: 0,
      forms: 0,
      events: 0,
      projects: 0
    });

    React.useEffect(() => {
      const fetchMyContent = async () => {
        try {
          const [announcements, assignments, resources, forms, events, projects] = await Promise.all([
            fetchWithAuth('/api/announcements').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/assignments').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/resources').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/forms').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/events').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/projects').then(r => r.ok ? r.json() : [])
          ]);

          setMyContent({
            announcements: announcements.filter(a => a.created_by?._id === user?.id || a.created_by === user?.id).length,
            assignments: assignments.filter(a => a.created_by?._id === user?.id || a.created_by === user?.id).length,
            resources: resources.filter(r => r.uploaded_by?._id === user?.id || r.uploaded_by === user?.id).length,
            forms: forms.filter(f => f.created_by?._id === user?.id || f.created_by === user?.id).length,
            events: events.filter(e => e.created_by?._id === user?.id || e.created_by === user?.id).length,
            projects: projects.filter(p => p.created_by?._id === user?.id || p.created_by === user?.id).length
          });
        } catch (err) {
          console.warn('Failed to fetch faculty content:', err);
        }
      };
      fetchMyContent();
    }, []);

    return (
      <Box>
        {/* Stats Overview */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary" fontWeight={600}>{myContent.announcements}</Typography>
              <Typography variant="caption">Announcements</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="secondary" fontWeight={600}>{myContent.assignments}</Typography>
              <Typography variant="caption">Assignments</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight={600}>{myContent.resources}</Typography>
              <Typography variant="caption">Resources</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight={600}>{myContent.forms}</Typography>
              <Typography variant="caption">Forms</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight={600}>{myContent.events}</Typography>
              <Typography variant="caption">Events</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="error.main" fontWeight={600}>{myContent.projects}</Typography>
              <Typography variant="caption">Projects</Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Faculty Actions - Professional CS Department */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 2, mt: 3 }}>📚 Faculty Management Panel</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={4} sx={{ bgcolor: 'secondary.main', color: 'white', borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <AssignmentIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Create Assignment</Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>Post assignments with deadlines, attachments, and submission tracking</Typography>
                <Button component={Link} to="/academics" variant="contained" sx={{ bgcolor: 'white', color: 'secondary.main', '&:hover': { bgcolor: 'grey.100' } }} fullWidth startIcon={<AddIcon />}>
                  New Assignment
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={4} sx={{ bgcolor: 'warning.main', color: 'white', borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <EventIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Schedule Event</Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>Organize workshops, seminars, hackathons, and tech talks</Typography>
                <Button component={Link} to="/events" variant="contained" sx={{ bgcolor: 'white', color: 'warning.main', '&:hover': { bgcolor: 'grey.100' } }} fullWidth startIcon={<AddIcon />}>
                  New Event
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={4} sx={{ bgcolor: 'success.main', color: 'white', borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <FolderIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Upload Materials</Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>Share lecture notes, PDFs, videos, and reference materials</Typography>
                <Button component={Link} to="/resources" variant="contained" sx={{ bgcolor: 'white', color: 'success.main', '&:hover': { bgcolor: 'grey.100' } }} fullWidth startIcon={<AddIcon />}>
                  Upload Resource
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={4} sx={{ bgcolor: 'error.main', color: 'white', borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <FolderIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Create Project</Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>Assign capstone projects, mini projects, and lab work</Typography>
                <Button component={Link} to="/projects" variant="contained" sx={{ bgcolor: 'white', color: 'error.main', '&:hover': { bgcolor: 'grey.100' } }} fullWidth startIcon={<AddIcon />}>
                  New Project
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderHODDashboard = () => {
    const [departmentStats, setDepartmentStats] = React.useState({
      announcements: 0,
      assignments: 0,
      resources: 0,
      forms: 0,
      events: 0,
      projects: 0,
      pending: 0
    });

    React.useEffect(() => {
      const fetchDepartmentStats = async () => {
        try {
          const [announcements, assignments, resources, forms, events, projects] = await Promise.all([
            fetchWithAuth('/api/announcements').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/assignments').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/resources').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/forms').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/events').then(r => r.ok ? r.json() : []),
            fetchWithAuth('/api/projects').then(r => r.ok ? r.json() : [])
          ]);

          const pending = [
            ...announcements.filter(a => a.status === 'pending'),
            ...assignments.filter(a => a.status === 'pending'),
            ...events.filter(e => e.status === 'pending'),
            ...projects.filter(p => p.status === 'pending')
          ].length;

          setDepartmentStats({
            announcements: announcements.length,
            assignments: assignments.length,
            resources: resources.length,
            forms: forms.length,
            events: events.length,
            projects: projects.length,
            pending
          });
        } catch (err) {
          console.warn('Failed to fetch department stats:', err);
        }
      };
      fetchDepartmentStats();
    }, []);

    return (
      <Box>
        {/* Department Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={3} lg={1.7}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary" fontWeight={600}>{departmentStats.announcements}</Typography>
              <Typography variant="caption">Announcements</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.7}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="secondary" fontWeight={600}>{departmentStats.assignments}</Typography>
              <Typography variant="caption">Assignments</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.7}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight={600}>{departmentStats.resources}</Typography>
              <Typography variant="caption">Resources</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.7}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight={600}>{departmentStats.forms}</Typography>
              <Typography variant="caption">Forms</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.7}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight={600}>{departmentStats.events}</Typography>
              <Typography variant="caption">Events</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.7}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="error.main" fontWeight={600}>{departmentStats.projects}</Typography>
              <Typography variant="caption">Projects</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={3} lg={1.7}>
            <Card sx={{ textAlign: 'center', p: 2, bgcolor: departmentStats.pending > 0 ? 'warning.light' : 'inherit' }}>
              <Typography variant="h4" color="error.main" fontWeight={600}>{departmentStats.pending}</Typography>
              <Typography variant="caption">Pending Approval</Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Pending Approvals Alert */}
        {departmentStats.pending > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6">
              {departmentStats.pending} item(s) require approval
            </Typography>
            <Button component={Link} to="/manage" variant="contained" color="warning" size="small" sx={{ mt: 1 }}>
              Review Now
            </Button>
          </Alert>
        )}

        {/* HOD/DEAN Management Panel - Professional CS Department */}
        <Typography variant="h5" fontWeight={600} sx={{ mb: 2, mt: 3 }}>🎓 Department Management</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={4} sx={{ bgcolor: 'secondary.main', color: 'white', borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <AssignmentIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Create Assignment</Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>Post department-wide or course-specific assignments</Typography>
                <Button component={Link} to="/academics" variant="contained" sx={{ bgcolor: 'white', color: 'secondary.main', '&:hover': { bgcolor: 'grey.100' } }} fullWidth startIcon={<AddIcon />}>
                  New Assignment
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={4} sx={{ bgcolor: 'warning.main', color: 'white', borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <EventIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Schedule Event</Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>Organize workshops, conferences, and department events</Typography>
                <Button component={Link} to="/events" variant="contained" sx={{ bgcolor: 'white', color: 'warning.main', '&:hover': { bgcolor: 'grey.100' } }} fullWidth startIcon={<AddIcon />}>
                  New Event
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={4} sx={{ bgcolor: 'success.main', color: 'white', borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <FolderIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Upload Materials</Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>Share lecture notes, PPTs, and reference documents</Typography>
                <Button component={Link} to="/resources" variant="contained" sx={{ bgcolor: 'white', color: 'success.main', '&:hover': { bgcolor: 'grey.100' } }} fullWidth startIcon={<AddIcon />}>
                  Upload Material
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={4} sx={{ bgcolor: 'error.main', color: 'white', borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <AssignmentIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Create Project</Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>Post research projects and final year project topics</Typography>
                <Button component={Link} to="/projects" variant="contained" sx={{ bgcolor: 'white', color: 'error.main', '&:hover': { bgcolor: 'grey.100' } }} fullWidth startIcon={<AddIcon />}>
                  New Project
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={4} sx={{ bgcolor: 'info.main', color: 'white', borderRadius: 3, height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <FolderIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>Upload Resources</Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>Share additional study resources and reference links</Typography>
                <Button component={Link} to="/resources" variant="contained" sx={{ bgcolor: 'white', color: 'info.main', '&:hover': { bgcolor: 'grey.100' } }} fullWidth startIcon={<AddIcon />}>
                  Upload Resource
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Fade in timeout={700}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Welcome, {user?.name || 'User'}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Role: {role}
            </Typography>
          </Box>
          
          {/* Notification Bell */}
          <IconButton 
            onClick={(e) => setNotificationAnchor(e.currentTarget)}
            color="primary"
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon fontSize="large" />
            </Badge>
          </IconButton>
          
          {/* Notification Menu */}
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={() => setNotificationAnchor(null)}
          >
            <MenuItem>New assignment posted in DBMS</MenuItem>
            <MenuItem>Event reminder: AI Workshop tomorrow</MenuItem>
            <MenuItem>Announcement: Holiday Notice</MenuItem>
            <Divider />
            <MenuItem component={Link} to="/notifications" onClick={() => setNotificationAnchor(null)}>
              <Typography color="primary">View All Notifications</Typography>
            </MenuItem>
          </Menu>
        </Box>

        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <Alert severity="info" icon={<PushPinIcon />} sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Pinned Announcements</Typography>
            {pinnedAnnouncements.map(pin => (
              <Box key={pin.id} sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {pin.title} 
                  <Chip label={pin.priority} size="small" color="error" sx={{ ml: 1 }} />
                </Typography>
              </Box>
            ))}
          </Alert>
        )}

        {/* Quick Actions */}
        <Card sx={{ mb: 3, bgcolor: 'primary.light', borderRadius: 3, elevation: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600} color="primary.dark">⚡ Quick Access</Typography>
            <Grid container spacing={2}>
              {['HOD', 'DEAN', 'Faculty'].includes(role) && (
                <>
                  <Grid item xs={6} sm={2.4}>
                    <Button 
                      component={Link} 
                      to="/academics" 
                      variant="contained" 
                      color="secondary"
                      fullWidth 
                      startIcon={<AssignmentIcon />}
                    >
                      Assignments
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={2.4}>
                    <Button 
                      component={Link} 
                      to="/events" 
                      variant="contained" 
                      color="warning"
                      fullWidth 
                      startIcon={<EventIcon />}
                    >
                      Events
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={2.4}>
                    <Button 
                      component={Link} 
                      to="/resources" 
                      variant="contained" 
                      color="success"
                      fullWidth 
                      startIcon={<FolderIcon />}
                    >
                      Materials
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={2.4}>
                    <Button 
                      component={Link} 
                      to="/projects" 
                      variant="contained" 
                      color="error"
                      fullWidth 
                      startIcon={<AssignmentIcon />}
                    >
                      Projects
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={2.4}>
                    <Button 
                      component={Link} 
                      to="/forums" 
                      variant="contained" 
                      color="info"
                      fullWidth 
                      startIcon={<AddIcon />}
                    >
                      Forums
                    </Button>
                  </Grid>
                </>
              )}
              {role === 'Student' && (
                <>
                  <Grid item xs={6} sm={3}>
                    <Button 
                      component={Link} 
                      to="/academics" 
                      variant="contained" 
                      fullWidth 
                      startIcon={<AssignmentIcon />}
                    >
                      Assignments
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button 
                      component={Link} 
                      to="/resources" 
                      variant="contained" 
                      fullWidth 
                      startIcon={<FolderIcon />}
                    >
                      Resources
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button 
                      component={Link} 
                      to="/forums" 
                      variant="contained" 
                      fullWidth 
                      startIcon={<AddIcon />}
                    >
                      Forums
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button 
                      component={Link} 
                      to="/events" 
                      variant="contained" 
                      fullWidth 
                      startIcon={<EventIcon />}
                    >
                      Events
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
        
        {role === 'Student' && renderStudentDashboard()}
        {role === 'Faculty' && renderFacultyDashboard()}
        {(role === 'HOD' || role === 'DEAN') && renderHODDashboard()}
      </Box>
    </Fade>
  );
};

export default Dashboard;
