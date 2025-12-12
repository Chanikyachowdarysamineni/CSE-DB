import React, { useState, useContext } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Fade, LinearProgress, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Paper, List, ListItem, ListItemText, Divider, Snackbar, Alert, CircularProgress } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { UserContext } from '../App';
import { broadcastContentNotification } from '../utils/notificationBroadcast';
import { useSocket } from '../contexts/SocketContext';
import fetchWithAuth from '../utils/api';

const milestones = ['All', 'Prototype', 'Final Demo'];
const teamMembers = ['All', 'Alice', 'Bob', 'Carol', 'Dave'];

const Projects = () => {
  const { user } = useContext(UserContext);
  const { on, off, connected, emit } = useSocket();
  const [milestone, setMilestone] = useState('All');
  const [team, setTeam] = useState('All');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [contentType, setContentType] = useState('Project');
  const [realtimeNotification, setRealtimeNotification] = useState({ open: false, message: '' });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ 
    title: '', 
    type: 'Project',
    milestone: 'Prototype', 
    team: '',
    subjectName: '',
    subjectCode: '',
    description: '',
    dueDate: '',
    expiryDate: '',
    googleFormLink: '',
    googleSheetLink: ''
  });

  // Fetch projects from database
  React.useEffect(() => {
    fetchWithAuth('/api/projects')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setProjects([]);
        setLoading(false);
      });
  }, []);

  // Real-time project listeners
  React.useEffect(() => {
    if (!connected) return;

    const handleNewProject = (project) => {
      setRealtimeNotification({ open: true, message: `💼 New project: ${project.title}` });
    };

    on('project:new', handleNewProject);

    return () => {
      off('project:new', handleNewProject);
    };
  }, [connected, on, off]);
  
  // Permissions - Faculty/HOD/DEAN can create and evaluate
  const canCreate = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  const canEvaluate = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  const canEdit = (project) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return project.created_by?._id === user.id;
    return false;
  };
  const canDelete = (project) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return project.created_by?._id === user.id;
    return false;
  };
  const canManage = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  
  // Filter projects based on role
  const filtered = projects.filter(p => {
    const matchesMilestone = milestone === 'All' || p.milestone === milestone;
    const matchesTeam = team === 'All' || (p.team && p.team.includes(team));
    
    // Students only see approved projects
    if (user?.role === 'Student') {
      return matchesMilestone && matchesTeam && p.status === 'approved';
    }
    
    // Faculty see their own projects and approved projects
    if (user?.role === 'Faculty') {
      return matchesMilestone && matchesTeam && (p.created_by?._id === user?.id || p.status === 'approved');
    }
    
    // HOD and DEAN see all projects
    return matchesMilestone && matchesTeam;
  });
  const handleCreateProject = async () => {
    try {
      const response = await fetchWithAuth('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          type: newProject.type,
          milestone: newProject.milestone,
          team: newProject.team,
          subject_name: newProject.subjectName,
          subject_code: newProject.subjectCode,
          description: newProject.description,
          due_date: newProject.dueDate,
          expiry_date: newProject.expiryDate,
          google_form_link: newProject.googleFormLink,
          google_sheet_link: newProject.googleSheetLink
        })
      });

      if (response.ok) {
        const createdProject = await response.json();
        setProjects(prev => [createdProject, ...prev]);
        setRealtimeNotification({ open: true, message: '\u2705 Project created successfully' });
        
        // Emit socket event
        if (connected) {
          emit('project:new', createdProject);
        }
        
        // Broadcast notification to students
        broadcastContentNotification({
          type: 'Project',
          title: newProject.title,
          message: newProject.description || 'New project has been posted',
          contentId: createdProject._id,
          priority: 'high'
        });
        
        setOpenCreateDialog(false);
        setNewProject({ 
          title: '', 
          type: 'Project',
          milestone: 'Prototype', 
          team: '',
          subjectName: '',
          subjectCode: '',
          description: '',
          dueDate: '',
          expiryDate: '',
          googleFormLink: '',
          googleSheetLink: ''
        });
      } else {
        setRealtimeNotification({ open: true, message: '\u274c Failed to create project' });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setRealtimeNotification({ open: true, message: '\u274c Error creating project' });
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const response = await fetchWithAuth(`/api/projects/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p._id !== id));
        setRealtimeNotification({ open: true, message: '\u2705 Project deleted successfully' });
      } else {
        setRealtimeNotification({ open: true, message: '\u274c Failed to delete project' });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setRealtimeNotification({ open: true, message: '\u274c Error deleting project' });
    }
  };

  const handleEvaluate = (id) => {
    console.log('Evaluating project:', id);
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
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>🚀 Projects</Typography>
          <Typography variant="body2" color="text.secondary">Research projects, capstone, and lab work</Typography>
        </Box>
        {canCreate && (
          <Button 
            variant="contained" 
            color="error" 
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
            + Create Project
          </Button>
        )}
      </Box>
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField select label="Milestone" value={milestone} onChange={e => setMilestone(e.target.value)} sx={{ minWidth: 150 }}>
          {milestones.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
        <TextField select label="Team Member" value={team} onChange={e => setTeam(e.target.value)} sx={{ minWidth: 150 }}>
          {teamMembers.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No projects found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map(p => (
            <Grid item xs={12} md={6} key={p._id}>
              <Fade in timeout={700}>
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6">{p.title}</Typography>
                    <Typography variant="body2">Milestone: {p.milestone}</Typography>
                    <LinearProgress variant="determinate" value={p.progress || 0} sx={{ my: 2, height: 8, borderRadius: 5 }} />
                    <Typography variant="body2">Team: {p.team?.join(', ') || 'No team assigned'}</Typography>
                    <Box mt={2} display="flex" gap={1}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => {
                          setSelectedProject(p);
                          setOpenDetailsDialog(true);
                        }}
                      >
                        View Details
                      </Button>
                      {!p.evaluated && canEvaluate && (
                        <Button variant="contained" color="success" onClick={() => handleEvaluate(p._id)}>
                          Evaluate
                        </Button>
                      )}
                      {!p.evaluated && user && user.role === 'Student' && (
                        <Button variant="outlined" color="secondary">Submit for Evaluation</Button>
                      )}
                      {canCreate && (
                        <Button variant="outlined" color="error" onClick={() => handleDeleteProject(p._id)}>
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

      {/* Create Project/Assignment Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Academic Content</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Content Type"
            fullWidth
            value={newProject.type}
            onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="Project">Project Announcement</option>
            <option value="Assignment">Assignment</option>
            <option value="Lab Work">Lab Work</option>
          </TextField>
          <TextField
            label="Title"
            fullWidth
            required
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            margin="normal"
          />
          <TextField
            label="Subject Name"
            fullWidth
            required
            value={newProject.subjectName}
            onChange={(e) => setNewProject({ ...newProject, subjectName: e.target.value })}
            margin="normal"
          />
          <TextField
            label="Subject Code"
            fullWidth
            required
            value={newProject.subjectCode}
            onChange={(e) => setNewProject({ ...newProject, subjectCode: e.target.value })}
            margin="normal"
            placeholder="e.g., CSE401"
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            margin="normal"
          />
          <TextField
            label="Due Date"
            type="datetime-local"
            fullWidth
            required
            value={newProject.dueDate}
            onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Expiry Date"
            type="date"
            fullWidth
            value={newProject.expiryDate}
            onChange={(e) => setNewProject({ ...newProject, expiryDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            helperText="Date after which this content will not be displayed"
          />
          <TextField
            label="Google Form Link (Optional)"
            fullWidth
            value={newProject.googleFormLink}
            onChange={(e) => setNewProject({ ...newProject, googleFormLink: e.target.value })}
            margin="normal"
            placeholder="https://forms.google.com/..."
          />
          <TextField
            label="Google Sheet Link (Optional)"
            fullWidth
            value={newProject.googleSheetLink}
            onChange={(e) => setNewProject({ ...newProject, googleSheetLink: e.target.value })}
            margin="normal"
            placeholder="https://docs.google.com/spreadsheets/..."
          />
          {newProject.type === 'Project' && (
            <TextField
              select
              label="Milestone"
              fullWidth
              value={newProject.milestone}
              onChange={(e) => setNewProject({ ...newProject, milestone: e.target.value })}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="Prototype">Prototype</option>
              <option value="Final Demo">Final Demo</option>
              <option value="Mid Review">Mid Review</option>
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box>
            <Typography variant="h5" fontWeight={600}>{selectedProject?.title}</Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={selectedProject?.subjectCode} color="primary" size="small" />
              <Chip label={selectedProject?.subjectName} color="default" size="small" />
              <Chip label={`Milestone: ${selectedProject?.milestone}`} color="info" size="small" />
              <Chip 
                label={selectedProject?.evaluated ? 'Evaluated' : 'Pending Evaluation'} 
                color={selectedProject?.evaluated ? 'success' : 'warning'} 
                size="small" 
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* Description */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {selectedProject?.description}
            </Typography>
          </Box>

          {/* Deadline */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Deadline</Typography>
            <Typography variant="body1" color="error">
              {selectedProject?.dueDate ? new Date(selectedProject.dueDate).toLocaleString() : 'Not specified'}
            </Typography>
          </Box>

          {/* Requirements */}
          {selectedProject?.requirements && selectedProject.requirements.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Requirements</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <List dense>
                  {selectedProject.requirements.map((req, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={`${idx + 1}. ${req}`} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          {/* Team Members */}
          {selectedProject?.team && selectedProject.team.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Team Members</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedProject.team.map((member, idx) => (
                  <Chip key={idx} label={member} color="primary" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {/* Progress */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Progress</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={selectedProject?.progress || 0} 
                sx={{ flex: 1, height: 8, borderRadius: 5 }} 
              />
              <Typography variant="body2" fontWeight="bold">{selectedProject?.progress}%</Typography>
            </Box>
          </Box>

          {/* Attachments */}
          {selectedProject?.attachments && selectedProject.attachments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Attachments ({selectedProject.attachments.length})
              </Typography>
              <Paper variant="outlined">
                <List>
                  {selectedProject.attachments.map((att, idx) => (
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
                      {idx < selectedProject.attachments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
          {!selectedProject?.evaluated && canEvaluate && (
            <Button 
              variant="contained" 
              color="success" 
              onClick={() => {
                handleEvaluate(selectedProject.id);
                setOpenDetailsDialog(false);
              }}
            >
              Evaluate
            </Button>
          )}
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

export default Projects;
