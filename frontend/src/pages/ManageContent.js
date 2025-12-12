import React, { useState, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  Button, 
  Chip, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Edit, Delete, Visibility, CheckCircle, Cancel } from '@mui/icons-material';
import { UserContext } from '../App';
import fetchWithAuth from '../utils/api';

const ManageContent = () => {
  const { user } = useContext(UserContext);
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Data states
  const [myAnnouncements, setMyAnnouncements] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myResources, setMyResources] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [myForms, setMyForms] = useState([]);
  const [pendingContent, setPendingContent] = useState([]);

  // Check if user has access
  const hasAccess = user && ['HOD', 'DEAN', 'Faculty'].includes(user.role);
  const canApprove = user && ['HOD', 'DEAN'].includes(user.role);

  // Fetch all content created by user
  React.useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetchWithAuth('/api/announcements').then(r => r.ok ? r.json() : []),
      fetchWithAuth('/api/events').then(r => r.ok ? r.json() : []),
      fetchWithAuth('/api/resources').then(r => r.ok ? r.json() : []),
      fetchWithAuth('/api/projects').then(r => r.ok ? r.json() : []),
      fetchWithAuth('/api/forms').then(r => r.ok ? r.json() : [])
    ])
      .then(([announcements, events, resources, projects, forms]) => {
        // Filter by user's content
        const myContent = (arr) => arr.filter(item => item.created_by?._id === user?.id || item.uploaded_by?._id === user?.id);
        
        setMyAnnouncements(myContent(announcements));
        setMyEvents(myContent(events));
        setMyResources(myContent(resources));
        setMyProjects(myContent(projects));
        setMyForms(myContent(forms));

        // Get pending content for approval (HOD/DEAN only)
        if (canApprove) {
          const pending = [
            ...announcements.filter(a => a.status === 'pending'),
            ...events.filter(e => e.status === 'pending'),
            ...resources.filter(r => r.status === 'pending'),
            ...projects.filter(p => p.status === 'pending'),
            ...forms.filter(f => f.status === 'pending')
          ];
          setPendingContent(pending);
        }

        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching content:', err);
        setLoading(false);
      });
  }, [hasAccess, canApprove, user?.id]);

  const handleEdit = (item, type) => {
    setSelectedItem({ ...item, contentType: type });
    setEditDialog(true);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    const endpoints = {
      'Announcement': '/api/announcements',
      'Event': '/api/events',
      'Resource': '/api/resources',
      'Project': '/api/projects',
      'Form': '/api/forms'
    };

    try {
      const res = await fetchWithAuth(`${endpoints[type]}/${id}`, { method: 'DELETE' });

      if (res.ok) {
        // Remove from local state
        if (type === 'Announcement') setMyAnnouncements(prev => prev.filter(a => a._id !== id));
        if (type === 'Event') setMyEvents(prev => prev.filter(e => e._id !== id));
        if (type === 'Resource') setMyResources(prev => prev.filter(r => r._id !== id));
        if (type === 'Project') setMyProjects(prev => prev.filter(p => p._id !== id));
        if (type === 'Form') setMyForms(prev => prev.filter(f => f._id !== id));

        setNotification({ open: true, message: `✅ ${type} deleted successfully`, severity: 'success' });
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      setNotification({ open: true, message: `❌ Failed to delete ${type}`, severity: 'error' });
    }
  };

  const handleApprove = async (id, type) => {
    const endpoints = {
      'Announcement': '/api/announcements',
      'Event': '/api/events',
      'Resource': '/api/resources',
      'Project': '/api/projects',
      'Form': '/api/forms'
    };

    try {
      const res = await fetchWithAuth(`${endpoints[type]}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' })
      });

      if (res.ok) {
        setPendingContent(prev => prev.filter(item => item._id !== id));
        setNotification({ open: true, message: `✅ ${type} approved successfully`, severity: 'success' });
      } else {
        throw new Error('Approval failed');
      }
    } catch (err) {
      console.error(`Error approving ${type}:`, err);
      setNotification({ open: true, message: `❌ Failed to approve ${type}`, severity: 'error' });
    }
  };

  const handleReject = async (id, type) => {
    const endpoints = {
      'Announcement': '/api/announcements',
      'Event': '/api/events',
      'Resource': '/api/resources',
      'Project': '/api/projects',
      'Form': '/api/forms'
    };

    try {
      const res = await fetchWithAuth(`${endpoints[type]}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected' })
      });

      if (res.ok) {
        setPendingContent(prev => prev.filter(item => item._id !== id));
        setNotification({ open: true, message: `❌ ${type} rejected`, severity: 'warning' });
      } else {
        throw new Error('Rejection failed');
      }
    } catch (err) {
      console.error(`Error rejecting ${type}:`, err);
      setNotification({ open: true, message: `❌ Failed to reject ${type}`, severity: 'error' });
    }
  };

  const handleSaveEdit = () => {
    console.log('Saving edited content:', selectedItem);
    setEditDialog(false);
    setSelectedItem(null);
  };

  const renderAnnouncementsTab = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Title</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Created</strong></TableCell>
            <TableCell><strong>Expiry</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {myAnnouncements.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.title}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>
                <Chip 
                  label={item.status} 
                  color={item.status === 'approved' ? 'success' : 'warning'} 
                  size="small" 
                />
              </TableCell>
              <TableCell>{item.created}</TableCell>
              <TableCell>{item.expiry}</TableCell>
              <TableCell>
                <IconButton size="small" color="primary" onClick={() => handleEdit(item, 'announcement')}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(item.id, 'announcement')}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderEventsTab = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Title</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Date</strong></TableCell>
            <TableCell><strong>Venue</strong></TableCell>
            <TableCell><strong>Expiry</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {myEvents.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.title}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.date}</TableCell>
              <TableCell>{item.venue}</TableCell>
              <TableCell>{item.expiry}</TableCell>
              <TableCell>
                <IconButton size="small" color="primary" onClick={() => handleEdit(item, 'event')}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(item.id, 'event')}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderResourcesTab = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Resource Name</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Subject</strong></TableCell>
            <TableCell><strong>Code</strong></TableCell>
            <TableCell><strong>Downloads</strong></TableCell>
            <TableCell><strong>Expiry</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {myResources.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.subject}</TableCell>
              <TableCell>{item.subjectCode}</TableCell>
              <TableCell>{item.downloads}</TableCell>
              <TableCell>{item.expiry}</TableCell>
              <TableCell>
                <IconButton size="small" color="primary" onClick={() => handleEdit(item, 'resource')}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(item.id, 'resource')}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderProjectsTab = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Title</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Subject</strong></TableCell>
            <TableCell><strong>Code</strong></TableCell>
            <TableCell><strong>Due Date</strong></TableCell>
            <TableCell><strong>Submissions</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {myProjects.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.title}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.subject}</TableCell>
              <TableCell>{item.subjectCode}</TableCell>
              <TableCell>{item.dueDate}</TableCell>
              <TableCell>{item.submissions}</TableCell>
              <TableCell>
                <IconButton size="small" color="primary" onClick={() => handleEdit(item, 'project')}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(item.id, 'project')}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderStatsCards = () => (
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h4" color="primary">{myAnnouncements.length}</Typography>
            <Typography variant="body2" color="textSecondary">Total Announcements</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h4" color="success.main">{myEvents.length}</Typography>
            <Typography variant="body2" color="textSecondary">Total Events</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h4" color="warning.main">{myResources.length}</Typography>
            <Typography variant="body2" color="textSecondary">Total Resources</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h4" color="error.main">{myProjects.length}</Typography>
            <Typography variant="body2" color="textSecondary">Total Projects/Assignments</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
          📋 Content Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage all your created content, approve pending submissions, and track engagement
        </Typography>
      </Box>

      {renderStatsCards()}

      <Card elevation={3}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Announcements" />
          <Tab label="Events" />
          <Tab label="Resources" />
          <Tab label="Projects & Assignments" />
        </Tabs>
        <Box p={3}>
          {tabValue === 0 && renderAnnouncementsTab()}
          {tabValue === 1 && renderEventsTab()}
          {tabValue === 2 && renderResourcesTab()}
          {tabValue === 3 && renderProjectsTab()}
        </Box>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit {selectedItem?.contentType}</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <>
              <TextField
                label="Title"
                fullWidth
                value={selectedItem.title || selectedItem.name || ''}
                onChange={(e) => setSelectedItem({ ...selectedItem, title: e.target.value, name: e.target.value })}
                margin="normal"
              />
              <TextField
                label="Expiry Date"
                type="date"
                fullWidth
                value={selectedItem.expiry || selectedItem.expiryDate || ''}
                onChange={(e) => setSelectedItem({ ...selectedItem, expiry: e.target.value, expiryDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );

  if (!hasAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access Denied: Only HOD, DEAN, and Faculty can access this panel.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
};

export default ManageContent;
