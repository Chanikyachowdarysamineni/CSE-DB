

import React, { useState, useContext } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, Fade, Chip, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, List, ListItem, 
  ListItemText, ListItemSecondaryAction, IconButton, Paper, Divider, Snackbar, Alert
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { UserContext } from '../App';
import { broadcastContentNotification } from '../utils/notificationBroadcast';
import { useSocket } from '../contexts/SocketContext';
import fetchWithAuth from '../utils/api';

const Academics = () => {
  const { user } = useContext(UserContext);
  const { on, off, connected, emit } = useSocket();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [realtimeNotification, setRealtimeNotification] = useState({ open: false, message: '' });
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    deadline: '',
    subjectName: '',
    subjectCode: '',
    type: 'Assignment'
  });

  // Fetch assignments from database
  React.useEffect(() => {
    fetchWithAuth('/api/assignments')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setAssignments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching assignments:', err);
        setAssignments([]);
        setLoading(false);
      });
  }, []);

  // Real-time assignment listeners
  React.useEffect(() => {
    if (!connected) return;

    const handleNewAssignment = (assignment) => {
      setAssignments(prev => [assignment, ...prev]);
      setRealtimeNotification({ open: true, message: `📚 New assignment: ${assignment.title}` });
    };

    const handleNewSubmission = (submission) => {
      setRealtimeNotification({ open: true, message: `✅ New submission received` });
    };

    on('assignment:new', handleNewAssignment);
    on('submission:new', handleNewSubmission);

    return () => {
      off('assignment:new', handleNewAssignment);
      off('submission:new', handleNewSubmission);
    };
  }, [connected, on, off]);
  
  const canCreate = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  const canEdit = (assignment) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return assignment.created_by === user.id;
    return false;
  };
  const canDelete = (assignment) => {
    if (!user) return false;
    if (['HOD', 'DEAN'].includes(user.role)) return true;
    if (user.role === 'Faculty') return assignment.created_by === user.id;
    return false;
  };
  const canDownloadSubmissions = user && ['HOD', 'DEAN', 'Faculty'].includes(user?.role);
  
  const subjects = React.useMemo(() => ['All', ...new Set(assignments.map(a => a.subject_code || a.subjectCode))], [assignments]);
  
  const filtered = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || (a.subject_code || a.subjectCode) === subjectFilter;
    
    // Students only see approved assignments
    if (user?.role === 'Student') {
      return matchesSearch && matchesSubject && a.status === 'approved';
    }
    
    // Faculty see their own assignments and approved assignments
    if (user?.role === 'Faculty') {
      return matchesSearch && matchesSubject && (a.created_by === user?.id || a.status === 'approved');
    }
    
    // HOD and DEAN see all assignments
    return matchesSearch && matchesSubject;
  });

  // Sort assignments
  const sorted = React.useMemo(() => {
    let result = [...filtered];
    switch(sortBy) {
      case 'deadline':
        result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        break;
      case 'subject':
        result.sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
        break;
      case 'status':
        result.sort((a, b) => (a.submitted ? 1 : 0) - (b.submitted ? 1 : 0));
        break;
      default:
        break;
    }
    return result;
  }, [filtered, sortBy]);
  
  const handleCreateAssignment = async () => {
    try {
      const response = await fetchWithAuth('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAssignment.title,
          description: newAssignment.description,
          deadline: newAssignment.deadline,
          type: newAssignment.type,
          subject_name: newAssignment.subjectName,
          subject_code: newAssignment.subjectCode
        })
      });

      if (response.ok) {
        const createdAssignment = await response.json();
        setAssignments(prev => [createdAssignment, ...prev]);
        setRealtimeNotification({ open: true, message: '✅ Assignment created successfully' });
        
        // Emit socket event
        if (connected && createdAssignment.status === 'approved') {
          emit('assignment:new', createdAssignment);
        }
        
        // Broadcast notification to students
        broadcastContentNotification({
          type: 'Assignment',
          title: `New Assignment: ${newAssignment.title}`,
          message: `${newAssignment.description || newAssignment.subjectName} - Due: ${new Date(newAssignment.deadline).toLocaleDateString()}`,
          contentId: createdAssignment._id,
          priority: 'high'
        });
        
        setOpenCreateDialog(false);
        setNewAssignment({
          title: '',
          description: '',
          deadline: '',
          subjectName: '',
          subjectCode: '',
          type: 'Assignment'
        });
      } else {
        setRealtimeNotification({ open: true, message: '❌ Failed to create assignment' });
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      setRealtimeNotification({ open: true, message: '❌ Error creating assignment' });
    }
  };

  const handleOpenSubmitDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setOpenSubmitDialog(true);
  };

  const handleFileSelect = (event) => {
    setSubmissionFile(event.target.files[0]);
  };

  const handleSubmitAssignment = () => {
    if (!submissionFile || !selectedAssignment) return;
    
    const now = new Date();
    const deadline = new Date(selectedAssignment.deadline);
    const isLate = now > deadline;
    
    // Optional: Enforce hard deadline (uncomment to prevent late submissions)
    // const hardDeadlineHours = 24; // Allow up to 24 hours late
    // if (now - deadline > hardDeadlineHours * 60 * 60 * 1000) {
    //   alert('Submission period has ended. Please contact your instructor.');
    //   return;
    // }
    
    const submission = {
      file: submissionFile.name,
      size: submissionFile.size,
      submittedAt: now.toLocaleString(),
      isLate: isLate,
      resubmissions: selectedAssignment.submission ? selectedAssignment.submission.resubmissions + 1 : 0
    };
    
    setAssignments(assignments.map(a => 
      a.id === selectedAssignment.id 
        ? { ...a, submitted: true, submission: submission }
        : a
    ));
    
    setOpenSubmitDialog(false);
    setSubmissionFile(null);
    setSelectedAssignment(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>📝 Assignments</Typography>
          <Typography variant="body2" color="text.secondary">Course assignments and submission tracking</Typography>
        </Box>
        {canCreate && (
          <Button 
            variant="contained" 
            color="secondary" 
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
            + Create Assignment
          </Button>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
      <>
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField 
          label="Search Assignments" 
          variant="outlined" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          sx={{ flex: 1, minWidth: 250 }} 
        />
        <TextField 
          select 
          label="Subject" 
          value={subjectFilter} 
          onChange={e => setSubjectFilter(e.target.value)} 
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
          <MenuItem value="deadline">Deadline</MenuItem>
          <MenuItem value="subject">Subject Code</MenuItem>
          <MenuItem value="status">Status</MenuItem>
        </TextField>
      </Box>
      <Grid container spacing={3}>
        {sorted.map(a => (
          <Grid item xs={12} md={6} key={a.id}>
            <Fade in timeout={700}>
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6">{a.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, mb: 2 }}>
                    <Chip label={`Deadline: ${a.deadline}`} color="info" size="small" />
                    {a.submitted ? (
                      <Chip label="Submitted" color="success" size="small" icon={<CheckCircleIcon />} />
                    ) : (
                      <Chip label="Pending" color="warning" size="small" />
                    )}
                    {a.grade && <Chip label={`Grade: ${a.grade}`} color="primary" size="small" />}
                  </Box>
                  
                  {/* Submission Details */}
                  {a.submission && (
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Submission Details
                      </Typography>
                      <Typography variant="caption" display="block">
                        File: {a.submission.file}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Submitted: {a.submission.submittedAt}
                      </Typography>
                      {a.submission.isLate && (
                        <Chip label="Late Submission" color="error" size="small" sx={{ mt: 0.5 }} />
                      )}
                      {a.submission.resubmissions > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Resubmissions: {a.submission.resubmissions}
                        </Typography>
                      )}
                    </Paper>
                  )}
                  
                  <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                    {user?.role === 'Student' && (
                      <>
                        {!a.submitted ? (
                          <Button 
                            variant="contained" 
                            color="primary"
                            onClick={() => handleOpenSubmitDialog(a)}
                          >
                            Submit Assignment
                          </Button>
                        ) : (
                          <Button 
                            variant="outlined" 
                            color="secondary"
                            onClick={() => handleOpenSubmitDialog(a)}
                            disabled={new Date() > new Date(a.deadline)}
                          >
                            Resubmit
                          </Button>
                        )}
                      </>
                    )}
                    {canDownloadSubmissions && a.submitted && (
                      <Button 
                        variant="outlined" 
                        startIcon={<DownloadIcon />}
                        size="small"
                      >
                        Download Submission
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>
      
      {/* Create Assignment Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Assignment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={newAssignment.title}
            onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={newAssignment.description}
            onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Subject Name"
            value={newAssignment.subjectName}
            onChange={(e) => setNewAssignment({ ...newAssignment, subjectName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Subject Code"
            value={newAssignment.subjectCode}
            onChange={(e) => setNewAssignment({ ...newAssignment, subjectCode: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Deadline"
            type="date"
            value={newAssignment.deadline}
            onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Type"
            value={newAssignment.type}
            onChange={(e) => setNewAssignment({ ...newAssignment, type: e.target.value })}
          >
            <MenuItem value="Assignment">Assignment</MenuItem>
            <MenuItem value="Quiz">Quiz</MenuItem>
            <MenuItem value="Exam">Exam</MenuItem>
            <MenuItem value="Lab">Lab</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAssignment} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
      
      {/* Submit Assignment Dialog */}
      <Dialog open={openSubmitDialog} onClose={() => setOpenSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Assignment</DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <>
              <Typography variant="h6" gutterBottom>{selectedAssignment.title}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Deadline: {selectedAssignment.deadline}
              </Typography>
              
              {selectedAssignment.submission && (
                <Paper variant="outlined" sx={{ p: 2, my: 2, bgcolor: 'warning.light' }}>
                  <Typography variant="body2" fontWeight="medium">
                    This is a resubmission
                  </Typography>
                  <Typography variant="caption">
                    Previous submission: {selectedAssignment.submission.file}
                  </Typography>
                </Paper>
              )}
              
              <Box sx={{ mt: 3, mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<AttachFileIcon />}
                  sx={{ py: 2 }}
                >
                  {submissionFile ? submissionFile.name : 'Choose File'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.zip,.rar"
                  />
                </Button>
                {submissionFile && (
                  <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {submissionFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(submissionFile.size)}
                        </Typography>
                      </Box>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => setSubmissionFile(null)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                )}
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                Accepted formats: PDF, Word, ZIP, RAR (Max 25MB)
              </Typography>
              
              {new Date() > new Date(selectedAssignment.deadline) && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'error.light' }}>
                  <Typography variant="body2" color="error.dark" fontWeight="medium">
                    ⚠️ Warning: The deadline has passed. This submission will be marked as late and may incur penalty.
                  </Typography>
                </Paper>
              )}
              {!selectedAssignment.submitted && new Date() < new Date(selectedAssignment.deadline) && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'success.light' }}>
                  <Typography variant="body2" color="success.dark" fontWeight="medium">
                    ✓ Submitting before deadline
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenSubmitDialog(false);
            setSubmissionFile(null);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitAssignment} 
            variant="contained"
            disabled={!submissionFile}
          >
            Submit
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
      
      </>
      )}
      
      {/* TODO: Add course materials, timetable, and grading system */}
    </Box>
  );
};

export default Academics;
