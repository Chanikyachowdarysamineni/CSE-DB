import React, { useState, useContext } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem, Fade, Chip, 
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, 
  Checkbox, Select, FormControl, InputLabel, InputAdornment, Paper, List, ListItem,
  ListItemText, Divider, Snackbar, Alert, CircularProgress
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ReportIcon from '@mui/icons-material/Report';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { UserContext } from '../App';
import { useSocket } from '../contexts/SocketContext';
import fetchWithAuth from '../utils/api';

const categories = ['All', 'DBMS', 'AI', 'OS', 'CN', 'ML', 'General'];

const Forums = () => {
  const { user } = useContext(UserContext);
  const { on, off, emit, connected } = useSocket();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState('All');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newThread, setNewThread] = useState({ 
    topic: '', 
    category: 'General', 
    anonymous: false, 
    content: '',
    google_form_link: '',
    google_sheet_link: ''
  });
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Fetch threads from database
  React.useEffect(() => {
    fetchWithAuth('/api/forums')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setThreads(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching forums:', err);
        setThreads([]);
        setLoading(false);
      });
  }, []);

  // Real-time forum listeners
  React.useEffect(() => {
    if (!connected) return;

    const handleNewThread = (thread) => {
      setThreads(prev => [thread, ...prev]);
      setNotification({ open: true, message: `💬 New forum thread: ${thread.topic}`, severity: 'info' });
    };

    const handleThreadDeleted = (threadId) => {
      setThreads(prev => prev.filter(t => t._id !== threadId));
      setNotification({ open: true, message: '🗑️ Thread deleted', severity: 'warning' });
    };

    on('forum:new', handleNewThread);
    on('forum:deleted', handleThreadDeleted);

    return () => {
      off('forum:new', handleNewThread);
      off('forum:deleted', handleThreadDeleted);
    };
  }, [connected, on, off]);
  
  // Permissions - Faculty/HOD/DEAN can create and moderate
  const canCreate = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  const canModerate = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  const canEdit = (thread) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return thread.created_by === user.id;
    return false;
  };
  const canDelete = (thread) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return thread.created_by === user.id;
    return false;
  };
  const canMarkAccepted = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  
  const filtered = threads.filter(t =>
    (category === 'All' || t.category === category) &&
    t.topic.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpvote = async (id) => {
    try {
      const res = await fetchWithAuth(`/api/forums/${id}/upvote`, { method: 'POST' });
      
      if (res.ok) {
        setThreads(prev => prev.map(t => 
          t._id === id ? { ...t, upvotes: (t.upvotes || 0) + 1 } : t
        ));
      }
    } catch (err) {
      console.error('Error upvoting:', err);
    }
  };

  const handleMarkAccepted = async (id) => {
    if (!canMarkAccepted) return;

    try {
      const res = await fetchWithAuth(`/api/forums/${id}/accept`, { method: 'PUT' });
      
      if (res.ok) {
        setThreads(prev => prev.map(t => 
          t._id === id ? { ...t, accepted: !t.accepted } : t
        ));
        setNotification({ open: true, message: '✅ Thread marked as accepted', severity: 'success' });
      }
    } catch (err) {
      console.error('Error marking accepted:', err);
      setNotification({ open: true, message: '❌ Failed to update status', severity: 'error' });
    }
  };

  const handleCreateThread = async () => {
    if (!newThread.topic || !newThread.content) {
      setNotification({ open: true, message: 'Please fill in topic and content', severity: 'error' });
      return;
    }

    setCreating(true);

    try {
      const res = await fetchWithAuth('/api/forums', {
        method: 'POST',
        body: JSON.stringify(newThread)
      });

      if (res.ok) {
        const createdThread = await res.json();
        setThreads(prev => [createdThread, ...prev]);
        
        if (connected) {
          emit('forum:new', createdThread);
        }

        setNotification({ open: true, message: '✅ Thread created successfully', severity: 'success' });
        setShowCreateDialog(false);
        setNewThread({ 
          topic: '', 
          category: 'General', 
          anonymous: false, 
          content: '',
          google_form_link: '',
          google_sheet_link: ''
        });
      } else {
        throw new Error('Creation failed');
      }
    } catch (err) {
      console.error('Error creating thread:', err);
      setNotification({ open: true, message: '❌ Failed to create thread', severity: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteThread = async (id) => {
    if (!window.confirm('Are you sure you want to delete this thread?')) return;

    try {
      const res = await fetchWithAuth(`/api/forums/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setThreads(prev => prev.filter(t => t._id !== id));
        
        if (connected) {
          emit('forum:deleted', id);
        }

        setNotification({ open: true, message: '✅ Thread deleted', severity: 'success' });
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      console.error('Error deleting thread:', err);
      setNotification({ open: true, message: '❌ Failed to delete thread', severity: 'error' });
    }
  };

  const handleReport = (id) => {
    console.log('Reporting thread:', id);
    alert('Thread reported to moderators');
  };

  const handleViewThread = (thread) => {
    setSelectedThread(thread);
    setShowViewDialog(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderCreateDialog = () => (
    <Dialog 
      open={showCreateDialog} 
      onClose={() => setShowCreateDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Create New Thread
        <IconButton
          onClick={() => setShowCreateDialog(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          label="Thread Topic"
          placeholder="Enter your question or topic"
          value={newThread.topic}
          onChange={(e) => setNewThread({ ...newThread, topic: e.target.value })}
          sx={{ mb: 2 }}
        />
        
        <TextField
          fullWidth
          label="Content"
          placeholder="Provide details about your question"
          value={newThread.content}
          onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
          multiline
          rows={4}
          sx={{ mb: 2 }}
        />
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={newThread.category}
            label="Category"
            onChange={(e) => setNewThread({ ...newThread, category: e.target.value })}
          >
            <MenuItem value="DBMS">DBMS</MenuItem>
            <MenuItem value="AI">AI</MenuItem>
            <MenuItem value="ML">ML</MenuItem>
            <MenuItem value="OS">OS</MenuItem>
          </Select>
        </FormControl>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={newThread.anonymous}
              onChange={(e) => setNewThread({ ...newThread, anonymous: e.target.checked })}
            />
          }
          label="Post anonymously"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
        <Button 
          onClick={handleCreateThread}
          variant="contained"
          disabled={!newThread.topic.trim() || !newThread.content.trim()}
        >
          Create Thread
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>💬 Discussion Forums</Typography>
          <Typography variant="body2" color="text.secondary">Ask questions, share knowledge, and engage with peers</Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            color="info"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
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
            + Create Thread
          </Button>
        )}
      </Box>
      
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search threads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Post Type</InputLabel>
          <Select
            value={postType}
            label="Post Type"
            onChange={(e) => setPostType(e.target.value)}
          >
            <MenuItem value="">All Post Types</MenuItem>
            <MenuItem value="Announcement">Announcement</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
            <MenuItem value="Assignment">Assignment</MenuItem>
            <MenuItem value="Project">Project</MenuItem>
            <MenuItem value="Forum">Forum</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Thread Cards */}
      <Grid container spacing={3}>
        {filtered.map(t => (
          <Grid item xs={12} md={6} key={t.id}>
            <Card sx={{ height: '100%', '&:hover': { boxShadow: 6 } }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>{t.topic}</Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label={t.category} color="primary" size="small" />
                  {t.accepted && (
                    <Chip 
                      label="Accepted Solution" 
                      color="success" 
                      size="small"
                      icon={<CheckCircleIcon />}
                    />
                  )}
                  {t.anonymous && (
                    <Chip label="Anonymous" color="warning" size="small" />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Button
                    size="small"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => handleUpvote(t.id)}
                    color="primary"
                  >
                    {t.upvotes} Upvotes
                  </Button>
                  {canMarkAccepted && (
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAccepted(t.id)}
                      color={t.accepted ? "success" : "default"}
                      title={t.accepted ? "Unmark as accepted" : "Mark as accepted"}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => handleViewThread(t)}
                  >
                    View Thread
                  </Button>
                  <Button variant="outlined" color="secondary" size="small">Moderate</Button>
                  {canDelete(t) && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteThread(t.id)}
                      title="Delete thread"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => handleReport(t.id)}
                    title="Report thread"
                  >
                    <ReportIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {renderCreateDialog()}

      {/* View Thread Dialog */}
      <Dialog 
        open={showViewDialog} 
        onClose={() => setShowViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box>
            <Typography variant="h5" fontWeight={600}>{selectedThread?.topic}</Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip label={selectedThread?.category} color="primary" size="small" />
              {selectedThread?.accepted && (
                <Chip 
                  label="Accepted Solution" 
                  color="success" 
                  size="small"
                  icon={<CheckCircleIcon />}
                />
              )}
              {selectedThread?.anonymous ? (
                <Chip label="Posted by: Anonymous" size="small" />
              ) : (
                <Chip label={`Posted by: ${selectedThread?.created_by}`} size="small" />
              )}
              <Chip label={`Date: ${selectedThread?.created_at}`} variant="outlined" size="small" />
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                <ThumbUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">{selectedThread?.upvotes} upvotes</Typography>
              </Box>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* Thread Content */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Content</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {selectedThread?.content}
            </Typography>
          </Box>

          {/* Google Form/Sheet Links */}
          {(selectedThread?.googleFormLink || selectedThread?.googleSheetLink) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Related Links</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {selectedThread?.googleFormLink && (
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    href={selectedThread.googleFormLink}
                    target="_blank"
                    fullWidth
                    sx={{ mb: selectedThread?.googleSheetLink ? 1 : 0 }}
                  >
                    Open Google Form
                  </Button>
                )}
                {selectedThread?.googleSheetLink && (
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    href={selectedThread.googleSheetLink}
                    target="_blank"
                    fullWidth
                  >
                    Open Google Sheet
                  </Button>
                )}
              </Paper>
            </Box>
          )}

          {/* Attachments */}
          {selectedThread?.attachments && selectedThread.attachments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Attachments ({selectedThread.attachments.length})
              </Typography>
              <Paper variant="outlined">
                <List>
                  {selectedThread.attachments.map((att, idx) => (
                    <React.Fragment key={att.id || idx}>
                      <ListItem>
                        <AttachFileIcon sx={{ mr: 2, color: 'text.secondary' }} />
                        <ListItemText
                          primary={att.name}
                          secondary={`${formatFileSize(att.size || 0)} • ${att.type || 'File'}`}
                        />
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => {
                            console.log('Download:', att.name);
                          }}
                        >
                          Download
                        </Button>
                      </ListItem>
                      {idx < selectedThread.attachments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          {/* TODO: Add replies/comments section here */}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<ThumbUpIcon />}
            onClick={() => {
              handleUpvote(selectedThread.id);
              setSelectedThread({ ...selectedThread, upvotes: selectedThread.upvotes + 1 });
            }}
          >
            Upvote
          </Button>
          {canMarkAccepted && (
            <Button
              startIcon={<CheckCircleIcon />}
              color={selectedThread?.accepted ? "success" : "default"}
              onClick={() => {
                handleMarkAccepted(selectedThread.id);
                setSelectedThread({ ...selectedThread, accepted: !selectedThread.accepted });
              }}
            >
              {selectedThread?.accepted ? 'Unmark' : 'Mark as Accepted'}
            </Button>
          )}
          <Button onClick={() => setShowViewDialog(false)}>Close</Button>
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
};

export default Forums;