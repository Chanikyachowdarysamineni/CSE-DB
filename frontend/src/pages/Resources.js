import React, { useState, useContext } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Fade, Chip, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, Snackbar, Alert, CircularProgress, IconButton } from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { UserContext } from '../App';
import { useSocket } from '../contexts/SocketContext';
import fetchWithAuth from '../utils/api';

const types = ['All', 'PDF', 'DOCX', 'PPT', 'Link', 'Video'];
const folders = ['All', 'Lecture Notes', 'Lab Materials', 'Reference Books', 'Question Papers', 'Other'];

const Resources = () => {
  const { user } = useContext(UserContext);
  const { on, off, emit, connected } = useSocket();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('All');
  const [folder, setFolder] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [uploading, setUploading] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    type: 'PDF',
    subject_name: '',
    subject_code: '',
    category: 'Lecture Notes',
    link: '',
    file_path: '',
    expiry_date: ''
  });

  // Fetch resources from database
  React.useEffect(() => {
    fetchWithAuth('/api/resources')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setResources(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching resources:', err);
        setResources([]);
        setLoading(false);
      });
  }, []);

  // Real-time updates
  React.useEffect(() => {
    if (!connected) return;

    const handleNewResource = (resource) => {
      setResources(prev => [resource, ...prev]);
      setNotification({ 
        open: true, 
        message: `📚 New resource uploaded: ${resource.name}`, 
        severity: 'info' 
      });
    };

    const handleResourceDeleted = (resourceId) => {
      setResources(prev => prev.filter(r => r._id !== resourceId));
      setNotification({ 
        open: true, 
        message: '🗑️ Resource deleted', 
        severity: 'warning' 
      });
    };

    on('resource:new', handleNewResource);
    on('resource:deleted', handleResourceDeleted);

    return () => {
      off('resource:new', handleNewResource);
      off('resource:deleted', handleResourceDeleted);
    };
  }, [connected, on, off]);
  
  // Permissions - Faculty/HOD/DEAN can upload and manage resources
  const canUpload = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  const canEdit = (resource) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return resource.uploaded_by === user.id;
    return false;
  };
  const canDelete = (resource) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return resource.uploaded_by === user.id;
    return false;
  };
  
  const handleUploadResource = async () => {
    if (!newResource.name || !newResource.subject_name || !newResource.subject_code) {
      setNotification({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    setUploading(true);
    
    try {
      const resourceData = {
        ...newResource,
        status: user.role === 'Faculty' ? 'pending' : 'approved'
      };

      const res = await fetchWithAuth('/api/resources', {
        method: 'POST',
        body: JSON.stringify(resourceData)
      });

      if (res.ok) {
        const createdResource = await res.json();
        setResources(prev => [createdResource, ...prev]);
        
        // Emit socket event
        if (connected) {
          emit('resource:new', createdResource);
        }

        setNotification({ 
          open: true, 
          message: user.role === 'Faculty' ? '✅ Resource uploaded (pending approval)' : '✅ Resource uploaded successfully', 
          severity: 'success' 
        });
        
        setOpenUploadDialog(false);
        setNewResource({
          name: '',
          type: 'PDF',
          subject_name: '',
          subject_code: '',
          category: 'Lecture Notes',
          link: '',
          file_path: '',
          expiry_date: ''
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Error uploading resource:', err);
      setNotification({ open: true, message: '❌ Failed to upload resource', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      const res = await fetchWithAuth(`/api/resources/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setResources(prev => prev.filter(r => r._id !== id));
        
        // Emit socket event
        if (connected) {
          emit('resource:deleted', id);
        }

        setNotification({ open: true, message: '✅ Resource deleted', severity: 'success' });
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
      setNotification({ open: true, message: '❌ Failed to delete resource', severity: 'error' });
    }
  };

  const handlePreview = (resource) => {
    setSelectedResource(resource);
    setOpenPreviewDialog(true);
  };

  const handleDownload = (resource) => {
    // Simulate download
    console.log('Downloading:', resource.name);
    // In a real app, this would trigger actual file download
    alert(`Downloading ${resource.name}...`);
  };

  const filtered = resources.filter(r => {
    const matchesType = type === 'All' || r.type === type;
    const matchesFolder = folder === 'All' || r.category === folder;
    
    // Students only see approved resources
    if (user?.role === 'Student') {
      return matchesType && matchesFolder && r.status === 'approved';
    }
    
    // Faculty see their own resources and approved resources
    if (user?.role === 'Faculty') {
      return matchesType && matchesFolder && (r.uploaded_by?._id === user?.id || r.status === 'approved');
    }
    
    // HOD and DEAN see all resources
    return matchesType && matchesFolder;
  });
  
  const sortedResources = React.useMemo(() => {
    let sorted = [...filtered];
    switch(sortBy) {
      case 'date':
        sorted.sort((a, b) => b.id - a.id); // Assuming higher ID = newer
        break;
      case 'expiry':
        sorted.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        break;
      case 'downloads':
        sorted.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'subject':
        sorted.sort((a, b) => (a.subjectCode || '').localeCompare(b.subjectCode || ''));
        break;
      default:
        break;
    }
    return sorted;
  }, [filtered, sortBy]);
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>📚 Resources</Typography>
          <Typography variant="body2" color="text.secondary">Study materials and reference documents</Typography>
        </Box>
        {canUpload && (
          <Button 
            variant="contained" 
            color="success" 
            onClick={() => setOpenUploadDialog(true)}
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
            + Upload Resource
          </Button>
        )}
      </Box>
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField select label="Type" value={type} onChange={e => setType(e.target.value)} sx={{ minWidth: 150 }}>
          {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField select label="Folder" value={folder} onChange={e => setFolder(e.target.value)} sx={{ minWidth: 150 }}>
          {folders.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
        </TextField>
      </Box>
      <Grid container spacing={3}>
        {sortedResources.map(r => (
          <Grid item xs={12} md={6} key={r.id}>
            <Fade in timeout={700}>
              <Card elevation={3} sx={{ borderRadius: 3, position: 'relative' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6">{r.name}</Typography>
                    {canDelete(r) && (
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteResource(r._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {r.subject_name} ({r.subject_code})
                  </Typography>
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Chip label={r.type} color="info" size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label={r.category} color="secondary" size="small" sx={{ mr: 1, mb: 1 }} />
                    {r.status === 'pending' && <Chip label="Pending" color="warning" size="small" sx={{ mb: 1 }} />}
                    {r.status === 'approved' && <Chip label="Approved" color="success" size="small" sx={{ mb: 1 }} />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Uploaded by: {r.uploaded_by?.name || 'Unknown'} • {new Date(r.created_at).toLocaleDateString()}
                  </Typography>
                  <Box mt={2}>
                    {r.link ? (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        sx={{ mr: 1 }}
                        startIcon={<PreviewIcon />}
                        onClick={() => window.open(r.link, '_blank')}
                      >
                        Open Link
                      </Button>
                    ) : (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        sx={{ mr: 1 }}
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(r)}
                      >
                        Download
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      <Dialog 
        open={openPreviewDialog} 
        onClose={() => setOpenPreviewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedResource?.name}</Typography>
            <Box>
              <Chip label={selectedResource?.type} color="primary" size="small" sx={{ mr: 1 }} />
              <Chip label={selectedResource?.version} color="info" size="small" />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedResource && (
            <Box>
              {/* PDF Preview */}
              {selectedResource.type === 'PDF' && (
                <Box sx={{ 
                  width: '100%', 
                  height: '70vh', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1
                }}>
                  <Typography variant="body1" color="text.secondary">
                    PDF Preview would display here. In production, use an iframe or PDF viewer library like react-pdf.
                  </Typography>
                  {/* Example: <iframe src={selectedResource.url} width="100%" height="100%" /> */}
                </Box>
              )}
              
              {/* Image Preview */}
              {['JPG', 'JPEG', 'PNG', 'GIF'].includes(selectedResource.type?.toUpperCase()) && (
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={selectedResource.url || '/placeholder-image.jpg'} 
                    alt={selectedResource.name}
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                  />
                </Box>
              )}
              
              {/* Document Info for non-previewable types */}
              {!['PDF', 'JPG', 'JPEG', 'PNG', 'GIF'].includes(selectedResource.type?.toUpperCase()) && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>Preview not available</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedResource.type} files cannot be previewed directly.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(selectedResource)}
                    sx={{ mt: 2 }}
                  >
                    Download to View
                  </Button>
                </Box>
              )}
              
              {/* Resource Details */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Subject</Typography>
                    <Typography variant="body2">{selectedResource.subjectName} ({selectedResource.subjectCode})</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Folder</Typography>
                    <Typography variant="body2">{selectedResource.folder}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Uploaded By</Typography>
                    <Typography variant="body2">{selectedResource.uploaded_by}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Downloads</Typography>
                    <Typography variant="body2">{selectedResource.downloads}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Expires On</Typography>
                    <Typography variant="body2">{selectedResource.expiryDate}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<DownloadIcon />}
            variant="contained"
            onClick={() => handleDownload(selectedResource)}
          >
            Download
          </Button>
          <Button onClick={() => setOpenPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📤 Upload Resource</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Resource Name *"
              fullWidth
              value={newResource.name}
              onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
            />
            <TextField
              select
              label="Type *"
              fullWidth
              value={newResource.type}
              onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
            >
              {types.filter(t => t !== 'All').map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Category *"
              fullWidth
              value={newResource.category}
              onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
            >
              {folders.filter(f => f !== 'All').map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </TextField>
            <TextField
              label="Subject Name *"
              fullWidth
              value={newResource.subject_name}
              onChange={(e) => setNewResource({ ...newResource, subject_name: e.target.value })}
              placeholder="e.g., Database Management Systems"
            />
            <TextField
              label="Subject Code *"
              fullWidth
              value={newResource.subject_code}
              onChange={(e) => setNewResource({ ...newResource, subject_code: e.target.value })}
              placeholder="e.g., CSE401"
            />
            <TextField
              label="Link URL"
              fullWidth
              value={newResource.link}
              onChange={(e) => setNewResource({ ...newResource, link: e.target.value })}
              placeholder="https://drive.google.com/..."
              helperText="Provide a Google Drive, Dropbox, or other cloud storage link"
            />
            <TextField
              label="Expiry Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newResource.expiry_date}
              onChange={(e) => setNewResource({ ...newResource, expiry_date: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUploadResource} 
            variant="contained" 
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
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
};

export default Resources;
