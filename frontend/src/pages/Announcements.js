import React from 'react';
import { 
  Box, Typography, TextField, Grid, Card, CardContent, Chip, Fade, Button, 
  FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction,
  Paper, Divider, Tooltip, ToggleButtonGroup, ToggleButton, Snackbar, Alert
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import { UserContext } from '../App';
import { broadcastContentNotification } from '../utils/notificationBroadcast';
import { useSocket } from '../contexts/SocketContext';
import fetchWithAuth from '../utils/api';

const Announcements = () => {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('All');
  const categories = ['All', 'Exam', 'Project', 'General'];
  const [postType, setPostType] = React.useState('');
  const [announcements, setAnnouncements] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = React.useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = React.useState(null);
  const [sortBy, setSortBy] = React.useState('date');
  const [realtimeNotification, setRealtimeNotification] = React.useState({ open: false, message: '' });
  const [newAnnouncement, setNewAnnouncement] = React.useState({
    title: '',
    body: '',
    priority: 'medium',
    expiry: '',
    subjectName: '',
    subjectCode: '',
    attachments: []
  });
  const [formats, setFormats] = React.useState([]);
  const bodyRef = React.useRef(null);
  const user = React.useContext(UserContext);
  const { on, off, connected, emit } = useSocket();

  const canCreate = ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  const canEdit = (announcement) => {
    if (['HOD', 'DEAN'].includes(user?.role)) return true;
    if (user?.role === 'Faculty') return announcement.sender_id === user?.id;
    return false;
  };
  const canDelete = (announcement) => {
    if (['HOD', 'DEAN'].includes(user?.role)) return true;
    if (user?.role === 'Faculty') return announcement.sender_id === user?.id;
    return false;
  };
  const canApprove = ['HOD', 'DEAN'].includes(user?.role);

  React.useEffect(() => {
    fetchWithAuth('/api/announcements')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch announcements');
        return res.json();
      })
      .then(data => {
        setAnnouncements(data);
        setLoading(false);
        setError(null);
      })
      .catch(err => {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements');
        setAnnouncements([]);
        setLoading(false);
      });
  }, []);

  // Real-time announcement updates
  React.useEffect(() => {
    if (!connected) return;

    const handleNewAnnouncement = (announcement) => {
      setAnnouncements(prev => [announcement, ...prev]);
      setRealtimeNotification({ 
        open: true, 
        message: `📢 New announcement: ${announcement.title}` 
      });
    };

    const handleUpdatedAnnouncement = (announcement) => {
      setAnnouncements(prev => 
        prev.map(a => a._id === announcement._id ? announcement : a)
      );
      setRealtimeNotification({ 
        open: true, 
        message: `✏️ Announcement updated: ${announcement.title}` 
      });
    };

    on('announcement:new', handleNewAnnouncement);
    on('announcement:updated', handleUpdatedAnnouncement);

    return () => {
      off('announcement:new', handleNewAnnouncement);
      off('announcement:updated', handleUpdatedAnnouncement);
    };
  }, [connected, on, off]);

  const filtered = announcements.filter(a => {
    const matchesSearch = a.title && a.body && (a.title.toLowerCase().includes(search.toLowerCase()) || a.body.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'All' || (category === 'Exam' && a.title && a.title.toLowerCase().includes('exam')) || (category === 'Project' && a.title && a.title.toLowerCase().includes('project'));
    
    // Students only see approved announcements
    if (user?.role === 'Student') {
      return matchesSearch && matchesCategory && a.status === 'approved';
    }
    
    // Faculty see their own posts and approved posts
    if (user?.role === 'Faculty') {
      return matchesSearch && matchesCategory && (a.sender_id === user?.id || a.status === 'approved');
    }
    
    // HOD and DEAN see all posts
    return matchesSearch && matchesCategory;
  });

  // Sort announcements
  const sorted = React.useMemo(() => {
    let result = [...filtered];
    switch(sortBy) {
      case 'date':
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'expiry':
        result.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        break;
      case 'priority':
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        result.sort((a, b) => (priorityOrder[b.priority?.toLowerCase()] || 0) - (priorityOrder[a.priority?.toLowerCase()] || 0));
        break;
      case 'category':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        break;
    }
    return result;
  }, [filtered, sortBy]);

  const handleCreateAnnouncement = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const announcementData = {
        title: newAnnouncement.title,
        body: newAnnouncement.body,
        priority: newAnnouncement.priority,
        expiry: newAnnouncement.expiry,
        subject_name: newAnnouncement.subjectName,
        subject_code: newAnnouncement.subjectCode,
        attachments: newAnnouncement.attachments
      };

      const response = await fetchWithAuth('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });

      if (response.ok) {
        const created = await response.json();
        setAnnouncements([created, ...announcements]);
        
        // Emit socket event
        if (connected && created.status === 'approved') {
          emit('announcement:new', created);
        }
        
        // Broadcast notification if approved
        if (created.status === 'approved') {
          broadcastContentNotification('Announcement', created, user?.role);
        }
        
        setOpenCreateDialog(false);
        setNewAnnouncement({ title: '', body: '', priority: 'medium', expiry: '', subjectName: '', subjectCode: '', attachments: [] });
        setFormats([]);
      } else {
        const error = await response.json();
        console.error('Failed to create announcement:', error);
        alert('Failed to create announcement: ' + (error.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating announcement:', err);
      alert('Failed to create announcement. Please try again.');
    }
  };

  const handleApprove = async (id) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (response.ok) {
        const updated = await response.json();
        setAnnouncements(announcements.map(a => (a._id === id || a.id === id) ? updated : a));
        
        // Broadcast notification when approved by HOD/DEAN
        broadcastContentNotification('Announcement', updated, user?.role);
      } else {
        console.error('Failed to approve announcement');
        alert('Failed to approve announcement');
      }
    } catch (err) {
      console.error('Error approving announcement:', err);
      alert('Failed to approve announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAnnouncements(announcements.filter(a => a._id !== id && a.id !== id));
      } else {
        console.error('Failed to delete announcement');
        alert('Failed to delete announcement');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement');
    }
  };

  const handleFormat = (event, newFormats) => {
    setFormats(newFormats);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const fileData = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setNewAnnouncement({ 
      ...newAnnouncement, 
      attachments: [...newAnnouncement.attachments, ...fileData] 
    });
  };

  const handleRemoveAttachment = (id) => {
    setNewAnnouncement({
      ...newAnnouncement,
      attachments: newAnnouncement.attachments.filter(att => att.id !== id)
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>📢 Announcements</Typography>
          <Typography variant="body2" color="text.secondary">Department-wide updates and important notices</Typography>
        </Box>
        {canCreate && (
          <Button 
            variant="contained" 
            color="primary" 
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
            + Create Announcement
          </Button>
        )}
      </Box>
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField 
          label="Search" 
          variant="outlined" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          sx={{ width: '100%', maxWidth: 400 }} 
        />
        <FormControl variant="outlined" sx={{ minWidth: 140 }}>
          <InputLabel>Post Type</InputLabel>
          <Select
            value={postType}
            onChange={e => setPostType(e.target.value)}
            label="Post Type"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Announcement">Announcement</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
            <MenuItem value="Assignment">Assignment</MenuItem>
            <MenuItem value="Project">Project</MenuItem>
            <MenuItem value="Forum">Forum</MenuItem>
          </Select>
        </FormControl>
        <FormControl variant="outlined" sx={{ minWidth: 140 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            label="Sort By"
          >
            <MenuItem value="date">Date (Newest)</MenuItem>
            <MenuItem value="expiry">Expiry Date</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="category">Category</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {sorted.map(a => (
            <Grid item xs={12} md={6} key={a._id || a.id}>
              <Fade in timeout={700}>
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6">{a.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={`Priority: ${a.priority}`} color="info" size="small" />
                    {a.subject_code && <Chip label={a.subject_code} color="primary" size="small" />}
                    {a.expiry && <Chip label={`Expiry: ${new Date(a.expiry).toLocaleDateString()}`} color="warning" size="small" />}
                  </Box>
                  {a.subject_name && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {a.subject_name}
                    </Typography>
                  )}
                    {a.status === 'pending' && <Chip label="Pending Approval" color="warning" sx={{ mr: 1 }} />}
                    {a.status === 'approved' && <Chip label="Approved" color="success" sx={{ mr: 1 }} />}
                    <Typography variant="body2" sx={{ mt: 2 }}>{a.body}</Typography>
                    
                    {/* Display Attachments */}
                    {a.attachments && a.attachments.length > 0 && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AttachFileIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="medium" color="text.secondary">
                            {a.attachments.length} Attachment{a.attachments.length > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {a.attachments.slice(0, 3).map((att, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <InsertPhotoIcon fontSize="small" color="action" />
                              <Typography variant="caption" sx={{ flex: 1 }}>
                                {att.name} ({formatFileSize(att.size || 0)})
                              </Typography>
                              <Button size="small" variant="text">Download</Button>
                            </Box>
                          ))}
                          {a.attachments.length > 3 && (
                            <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                              +{a.attachments.length - 3} more files
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    
                    <Box mt={2} display="flex" gap={1}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => {
                          setSelectedAnnouncement(a);
                          setOpenDetailsDialog(true);
                        }}
                      >
                        View Details
                      </Button>
                      {canApprove && a.status === 'pending' && (
                        <Button variant="contained" color="success" onClick={() => handleApprove(a._id || a.id)}>
                          Approve
                        </Button>
                      )}
                      {canDelete(a) && (
                        <Button variant="outlined" color="error" onClick={() => handleDelete(a._id || a.id)}>
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
      )}

      {/* Create Announcement Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Announcement</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            label="Subject Name"
            fullWidth
            value={newAnnouncement.subjectName}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, subjectName: e.target.value })}
            margin="normal"
            required
            placeholder="e.g., Database Management Systems"
          />
          <TextField
            label="Subject Code"
            fullWidth
            value={newAnnouncement.subjectCode}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, subjectCode: e.target.value })}
            margin="normal"
            required
            placeholder="e.g., CSE401"
          />
          
          {/* Rich Text Toolbar */}
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Content
            </Typography>
            <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
              <ToggleButtonGroup
                value={formats}
                onChange={handleFormat}
                size="small"
                aria-label="text formatting"
              >
                <ToggleButton value="bold" aria-label="bold">
                  <FormatBoldIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="italic" aria-label="italic">
                  <FormatItalicIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="underlined" aria-label="underlined">
                  <FormatUnderlinedIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="bulletList" aria-label="bullet list">
                  <FormatListBulletedIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="numberedList" aria-label="numbered list">
                  <FormatListNumberedIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="link" aria-label="insert link">
                  <LinkIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="Active formats will be applied to your text. This is a visual toolbar - full rich text editor integration can be added with libraries like react-quill or draft-js.">
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  {formats.length > 0 ? `Active: ${formats.join(', ')}` : 'Select formatting options'}
                </Typography>
              </Tooltip>
            </Paper>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={6}
            value={newAnnouncement.body}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, body: e.target.value })}
            placeholder="Write your announcement here..."
            inputRef={bodyRef}
          />
          <TextField
            select
            label="Priority"
            fullWidth
            value={newAnnouncement.priority}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </TextField>
          <TextField
            label="Expiry Date"
            type="date"
            fullWidth
            value={newAnnouncement.expiry}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expiry: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          
          {/* File Attachments */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Attachments ({newAnnouncement.attachments.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AttachFileIcon />}
                component="label"
              >
                Add Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                />
              </Button>
            </Box>
            
            {newAnnouncement.attachments.length > 0 && (
              <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {newAnnouncement.attachments.map((att) => (
                    <React.Fragment key={att.id}>
                      <ListItem>
                        <ListItemText
                          primary={att.name}
                          secondary={`${formatFileSize(att.size)} • ${att.type || 'Unknown type'}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            size="small" 
                            onClick={() => handleRemoveAttachment(att.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Supported formats: PDF, Word, Excel, PowerPoint, Text, Images (Max 10MB per file)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAnnouncement} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Announcement Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box>
            <Typography variant="h5" fontWeight={600}>{selectedAnnouncement?.title}</Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`Priority: ${selectedAnnouncement?.priority}`} color={
                selectedAnnouncement?.priority === 'high' ? 'error' : 
                selectedAnnouncement?.priority === 'medium' ? 'warning' : 'default'
              } size="small" />
              <Chip label={`Expires: ${selectedAnnouncement?.expiry}`} color="info" size="small" />
              <Chip label={`Author ID: ${selectedAnnouncement?.sender_id}`} color="primary" size="small" />
              {selectedAnnouncement?.status && (
                <Chip 
                  label={selectedAnnouncement.status === 'approved' ? 'Approved' : 'Pending'} 
                  color={selectedAnnouncement.status === 'approved' ? 'success' : 'warning'} 
                  size="small" 
                />
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Content</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {selectedAnnouncement?.body}
            </Typography>
          </Box>
          
          {/* Display all attachments with download functionality */}
          {selectedAnnouncement?.attachments && selectedAnnouncement.attachments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Attachments ({selectedAnnouncement.attachments.length})
              </Typography>
              <Paper variant="outlined">
                <List>
                  {selectedAnnouncement.attachments.map((att, idx) => (
                    <React.Fragment key={att.id || idx}>
                      <ListItem>
                        <ListItemText
                          primary={att.name}
                          secondary={`${formatFileSize(att.size || 0)} • ${att.type || 'File'}`}
                        />
                        <ListItemSecondaryAction>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => {
                              // Download functionality
                              if (att.file) {
                                const url = URL.createObjectURL(att.file);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = att.name;
                                a.click();
                                URL.revokeObjectURL(url);
                              }
                            }}
                          >
                            Download
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {idx < selectedAnnouncement.attachments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Real-time notification snackbar */}
      <Snackbar 
        open={realtimeNotification.open} 
        autoHideDuration={4000} 
        onClose={() => setRealtimeNotification({ ...realtimeNotification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setRealtimeNotification({ ...realtimeNotification, open: false })} 
          severity="info" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {realtimeNotification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Announcements;
