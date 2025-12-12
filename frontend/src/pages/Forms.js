import React, { useState, useContext } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Paper, List,
  ListItem, ListItemText, Divider, IconButton, InputAdornment, CircularProgress,
  Snackbar, Alert
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { UserContext } from '../App';
import { useSocket } from '../contexts/SocketContext';
import fetchWithAuth from '../utils/api';

const categories = ['All', 'Feedback', 'Registration', 'Survey', 'Assessment', 'Other'];

const Forms = () => {
  const { user } = useContext(UserContext);
  const { on, off, emit, connected } = useSocket();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [subject, setSubject] = useState('All');
  
  // Get unique subjects from forms
  const subjects = React.useMemo(() => {
    const uniqueSubjects = ['All', ...new Set(forms.map(f => f.subject_code).filter(Boolean))];
    return uniqueSubjects;
  }, [forms]);
  const [sortBy, setSortBy] = useState('createdDate');
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [newForm, setNewForm] = useState({
    title: '',
    category: 'Feedback',
    subject_name: '',
    subject_code: '',
    google_form_link: '',
    google_sheet_link: '',
    expiry_date: ''
  });

  // Fetch forms from database
  React.useEffect(() => {
    fetchWithAuth('/api/forms')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setForms(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching forms:', err);
        setForms([]);
        setLoading(false);
      });
  }, []);

  // Real-time updates
  React.useEffect(() => {
    if (!connected) return;

    const handleNewForm = (form) => {
      setForms(prev => [form, ...prev]);
      setNotification({ 
        open: true, 
        message: `📋 New form created: ${form.title}`, 
        severity: 'info' 
      });
    };

    const handleFormDeleted = (formId) => {
      setForms(prev => prev.filter(f => f._id !== formId));
      setNotification({ 
        open: true, 
        message: '🗑️ Form deleted', 
        severity: 'warning' 
      });
    };

    on('form:new', handleNewForm);
    on('form:deleted', handleFormDeleted);

    return () => {
      off('form:new', handleNewForm);
      off('form:deleted', handleFormDeleted);
    };
  }, [connected, on, off]);

  const canCreate = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  const canEdit = (form) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return form.created_by?._id === user.id;
    return false;
  };
  const canDelete = (form) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return form.created_by?._id === user.id;
    return false;
  };

  // Filter forms
  const filtered = forms.filter(f => {
    const matchesSearch = f.title?.toLowerCase().includes(search.toLowerCase()) || 
                         f.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || f.category === category;
    const matchesSubject = subject === 'All' || f.subject_code === subject;
    
    // Students only see approved forms
    if (user?.role === 'Student') {
      return matchesSearch && matchesCategory && matchesSubject && f.status === 'approved';
    }
    
    // Faculty see their own forms and approved forms
    if (user?.role === 'Faculty') {
      return matchesSearch && matchesCategory && matchesSubject && (f.created_by?._id === user?.id || f.status === 'approved');
    }
    
    // HOD and DEAN see all forms
    return matchesSearch && matchesCategory && matchesSubject;
  });

  // Sort forms
  const sorted = React.useMemo(() => {
    let result = [...filtered];
    switch(sortBy) {
      case 'category':
        result.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      case 'subject':
        result.sort((a, b) => (a.subject_code || '').localeCompare(b.subject_code || ''));
        break;
      case 'createdDate':
        result.sort((a, b) => new Date(b.createdAt || b.created_date) - new Date(a.createdAt || a.created_date));
        break;
      case 'expiryDate':
        result.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
        break;
      case 'responses':
        result.sort((a, b) => (b.responses || 0) - (a.responses || 0));
        break;
      default:
        break;
    }
    return result;
  }, [filtered, sortBy]);

  const handleCreateForm = async () => {
    if (!newForm.title || !newForm.subject_name || !newForm.subject_code || !newForm.google_form_link) {
      setNotification({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }
    
    setCreating(true);
    
    try {
      const formData = {
        ...newForm,
        status: user.role === 'Faculty' ? 'pending' : 'approved'
      };

      const res = await fetchWithAuth('/api/forms', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const createdForm = await res.json();
        setForms(prev => [createdForm, ...prev]);
        
        // Emit socket event
        if (connected) {
          emit('form:new', createdForm);
        }

        setNotification({ 
          open: true, 
          message: user.role === 'Faculty' ? '✅ Form created (pending approval)' : '✅ Form created successfully', 
          severity: 'success' 
        });
        
        setOpenCreateDialog(false);
        setNewForm({
          title: '',
          category: 'Feedback',
          subject_name: '',
          subject_code: '',
          google_form_link: '',
          google_sheet_link: '',
          expiry_date: ''
        });
      } else {
        throw new Error('Creation failed');
      }
    } catch (error) {
      console.error('Error creating form:', error);
      setNotification({ open: true, message: '❌ Failed to create form', severity: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteForm = async (id) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;
      
      try {
        const res = await fetchWithAuth(`/api/forms/${id}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          setForms(prev => prev.filter(f => f._id !== id));
          
          // Emit socket event
          if (connected) {
            emit('form:deleted', id);
          }

          setNotification({ open: true, message: '✅ Form deleted', severity: 'success' });
        } else {
          throw new Error('Delete failed');
        }
      } catch (error) {
        console.error('Error deleting form:', error);
        setNotification({ open: true, message: '❌ Failed to delete form', severity: 'error' });
      }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>📋 Forms & Links</Typography>
          <Typography variant="body2" color="text.secondary">Google Forms for surveys, feedback, and registrations</Typography>
        </Box>
        {canCreate && (
          <Button 
            variant="contained" 
            color="info" 
            startIcon={<AddIcon />}
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
            + Create Form Link
          </Button>
        )}
      </Box>

      {/* Filters and Search */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField 
          label="Search Forms" 
          variant="outlined" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          sx={{ flex: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField 
          select 
          label="Category" 
          value={category} 
          onChange={e => setCategory(e.target.value)} 
          sx={{ minWidth: 150 }}
        >
          {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
        </TextField>
        <TextField 
          select 
          label="Subject" 
          value={subject} 
          onChange={e => setSubject(e.target.value)} 
          sx={{ minWidth: 150 }}
        >
          {subjects.map(sub => <MenuItem key={sub} value={sub}>{sub}</MenuItem>)}
        </TextField>
        <TextField 
          select 
          label="Sort By" 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value)} 
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="createdDate">Created Date (Newest)</MenuItem>
          <MenuItem value="expiryDate">Expiry Date</MenuItem>
          <MenuItem value="category">Category</MenuItem>
          <MenuItem value="subject">Subject Code</MenuItem>
          <MenuItem value="responses">Response Count</MenuItem>
        </TextField>
      </Box>

      {/* Forms Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : sorted.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No forms found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {sorted.map(form => (
            <Grid item xs={12} md={6} key={form._id}>
              <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" fontWeight={600}>{form.title}</Typography>
                    {canDelete(form) && (
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteForm(form._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={form.category} color="primary" size="small" />
                    <Chip label={form.subject_code || 'N/A'} color="info" size="small" />
                    <Chip label={`${form.responses || 0} responses`} color="success" size="small" />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {form.subject}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Created: {new Date(form.createdAt || form.created_date).toLocaleDateString()} • Expires: {form.expiry_date ? new Date(form.expiry_date).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    By: {form.created_by?.name || 'Unknown'}
                  </Typography>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<OpenInNewIcon />}
                      href={form.google_form_link}
                      target="_blank"
                      size="small"
                    >
                      Open Form
                    </Button>
                    {form.google_sheet_link && (
                      <Button 
                        variant="outlined" 
                        color="secondary"
                        startIcon={<OpenInNewIcon />}
                        href={form.google_sheet_link}
                        target="_blank"
                        size="small"
                      >
                        View Responses
                      </Button>
                    )}
                  <Button 
                    variant="text" 
                    size="small"
                    onClick={() => {
                      setSelectedForm(form);
                      setOpenViewDialog(true);
                    }}
                  >
                    Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      )}

      {/* Create Form Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Form Link</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Form Title"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={newForm.category}
            onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
            margin="normal"
          >
            {categories.filter(c => c !== 'All').map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Subject Name"
            value={newForm.subject_name}
            onChange={(e) => setNewForm({ ...newForm, subject_name: e.target.value })}
            margin="normal"
            placeholder="e.g., Database Management Systems"
            required
          />
          <TextField
            fullWidth
            label="Subject Code"
            value={newForm.subject_code}
            onChange={(e) => setNewForm({ ...newForm, subject_code: e.target.value })}
            margin="normal"
            placeholder="e.g., CSE401"
            required
          />
          <TextField
            fullWidth
            label="Google Form Link"
            value={newForm.google_form_link}
            onChange={(e) => setNewForm({ ...newForm, google_form_link: e.target.value })}
            margin="normal"
            placeholder="https://forms.google.com/..."
            required
          />
          <TextField
            fullWidth
            label="Google Sheet Link (Responses)"
            value={newForm.google_sheet_link}
            onChange={(e) => setNewForm({ ...newForm, google_sheet_link: e.target.value })}
            margin="normal"
            placeholder="https://docs.google.com/spreadsheets/..."
            helperText="Optional - Link to view form responses"
          />
          <TextField
            fullWidth
            label="Expiry Date"
            type="date"
            value={newForm.expiry_date}
            onChange={(e) => setNewForm({ ...newForm, expiry_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateForm} 
            variant="contained"
            disabled={creating || !newForm.title || !newForm.google_form_link || !newForm.subject_code || !newForm.expiry_date}
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Form Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedForm?.title}</DialogTitle>
        <DialogContent dividers>
          {selectedForm && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Category & Subject</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={selectedForm.category} color="primary" />
                  <Chip label={selectedForm.subjectCode} color="info" />
                </Box>
                <Typography variant="body2">{selectedForm.subject}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Statistics</Typography>
                <Typography variant="body2">Total Responses: {selectedForm.responses}</Typography>
                <Typography variant="body2">Created By: {selectedForm.createdBy}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Dates</Typography>
                <Typography variant="body2">Created: {selectedForm.createdDate}</Typography>
                <Typography variant="body2">Expires: {selectedForm.expiryDate}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Links</Typography>
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<OpenInNewIcon />}
                  href={selectedForm.googleFormLink}
                  target="_blank"
                  sx={{ mb: 1 }}
                >
                  Open Google Form
                </Button>
                {selectedForm.googleSheetLink && (
                  <Button 
                    variant="outlined" 
                    fullWidth
                    startIcon={<OpenInNewIcon />}
                    href={selectedForm.googleSheetLink}
                    target="_blank"
                  >
                    View Responses Sheet
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
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

export default Forms;
