import React, { useState, useContext } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, Chip, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, List, ListItem, 
  ListItemText, IconButton, Paper, Tabs, Tab, Divider, Avatar, Stack
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import { UserContext } from '../App';
import fetchWithAuth from '../utils/api';

const getFileIcon = (type) => {
  switch(type) {
    case 'pdf': return <PictureAsPdfIcon sx={{ color: '#d32f2f' }} />;
    case 'doc':
    case 'docx': return <DescriptionIcon sx={{ color: '#1976d2' }} />;
    case 'ppt':
    case 'pptx': return <SlideshowIcon sx={{ color: '#ed6c02' }} />;
    case 'jpg':
    case 'png':
    case 'jpeg': return <ImageIcon sx={{ color: '#2e7d32' }} />;
    case 'zip': return <FolderZipIcon sx={{ color: '#9c27b0' }} />;
    default: return <DescriptionIcon />;
  }
};

const getStatusChip = (status) => {
  switch(status) {
    case 'submitted':
      return <Chip icon={<CheckCircleIcon />} label="Submitted" color="success" size="small" />;
    case 'pending':
      return <Chip icon={<PendingIcon />} label="Pending" color="warning" size="small" />;
    case 'overdue':
      return <Chip icon={<ErrorIcon />} label="Overdue" color="error" size="small" />;
    default:
      return <Chip label={status} size="small" />;
  }
};

const Academics = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  
  // Database state
  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from database
  React.useEffect(() => {
    Promise.all([
      fetchWithAuth('/api/assignments').then(res => res.ok ? res.json() : []),
      
      fetchWithAuth('/api/resources').then(res => res.ok ? res.json() : []),
      
      fetchWithAuth('/api/submissions/my').then(res => res.ok ? res.json() : [])
    ])
    .then(([assignmentsData, resourcesData, submissionsData]) => {
      setAssignments(assignmentsData);
      setResources(resourcesData);
      setSubmissions(submissionsData);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching academics data:', err);
      setLoading(false);
    });
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmitDialogOpen(true);
  };

  const handleFileUpload = (event) => {
    setUploadFile(event.target.files[0]);
  };

  const handleDownloadAllMaterials = () => {
    alert('Downloading all study materials...');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Academics
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={3}>
        Your study materials and assignments
      </Typography>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem'
          }
        }}
      >
        <Tab label="Materials" />
        <Tab label="Assignments" />
      </Tabs>

      {/* Materials Section */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <MenuBookIcon sx={{ color: '#667eea', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600}>
                Study Materials
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={handleDownloadAllMaterials}
              sx={{ 
                textTransform: 'none',
                bgcolor: '#667eea',
                '&:hover': { bgcolor: '#5568d3' }
              }}
            >
              Download All Materials
            </Button>
          </Box>

          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12}>
                <Typography>Loading materials...</Typography>
              </Grid>
            ) : resources.length === 0 ? (
              <Grid item xs={12}>
                <Typography color="textSecondary">No study materials available</Typography>
              </Grid>
            ) : (
              // Group resources by subject
              Object.entries(
                resources.reduce((acc, resource) => {
                  const key = resource.subject_name || 'General';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(resource);
                  return acc;
                }, {})
              ).map(([subjectName, materials]) => (
                <Grid item xs={12} md={6} key={subjectName}>
                  <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2, height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                          <MenuBookIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            {subjectName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {materials[0]?.subject_code || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <List sx={{ p: 0 }}>
                        {materials.map((material, matIdx) => (
                          <ListItem 
                            key={material._id || matIdx}
                            sx={{ 
                              px: 0,
                              py: 1,
                              '&:hover': { bgcolor: '#f5f5f5', borderRadius: 1 }
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={2} width="100%">
                              {getFileIcon(material.type)}
                              <Box flex={1}>
                                <Typography variant="body2" fontWeight={500}>
                                  {material.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Uploaded by: {material.uploaded_by?.name || 'Unknown'}
                                </Typography>
                              </Box>
                              <IconButton 
                                size="small" 
                                color="primary"
                                component="a"
                                href={material.link || material.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                disabled={!material.link && !material.file_path}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      )}

      {/* Assignments Section */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <AssignmentIcon sx={{ color: '#667eea', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600}>
              Assignments
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12}>
                <Typography>Loading assignments...</Typography>
              </Grid>
            ) : assignments.length === 0 ? (
              <Grid item xs={12}>
                <Typography color="textSecondary">No assignments available</Typography>
              </Grid>
            ) : (
              assignments.map((assignment) => {
                // Calculate status based on submission and deadline
                const submission = submissions.find(s => s.assignment_id?._id === assignment._id || s.assignment_id === assignment._id);
                const isOverdue = new Date() > new Date(assignment.deadline);
                const status = submission ? 'submitted' : isOverdue ? 'overdue' : 'pending';
                
                return (
                  <Grid item xs={12} md={6} key={assignment._id || assignment.id}>
                    <Card 
                      sx={{ 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                        }
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Box>
                            <Typography variant="h6" fontWeight={600} mb={0.5}>
                              {assignment.title}
                            </Typography>
                            <Chip 
                              label={assignment.subject_code || 'N/A'} 
                              size="small" 
                              sx={{ 
                                bgcolor: '#e3e8ff', 
                                color: '#667eea',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                          {getStatusChip(status)}
                        </Box>

                        <Typography variant="body2" color="textSecondary" mb={2}>
                          {assignment.description || 'No description provided'}
                        </Typography>

                        <Box 
                          sx={{ 
                            bgcolor: '#f8f9ff', 
                            p: 1.5, 
                            borderRadius: 1,
                            mb: 2
                          }}
                        >
                          <Typography variant="caption" color="textSecondary">
                            Due Date
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color={isOverdue ? 'error.main' : 'text.primary'}>
                            {new Date(assignment.deadline).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </Typography>
                        </Box>

                        {status !== 'submitted' && (
                          <Button 
                            variant="contained" 
                            fullWidth
                            startIcon={<UploadFileIcon />}
                            onClick={() => handleSubmitAssignment(assignment)}
                            sx={{ 
                              textTransform: 'none',
                              bgcolor: '#667eea',
                              '&:hover': { bgcolor: '#5568d3' }
                            }}
                          >
                            Upload Submission
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Box>
      )}

      {/* Submit Assignment Dialog */}
      <Dialog 
        open={submitDialogOpen} 
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Submit Assignment
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedAssignment?.topic}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ 
                height: 120,
                borderStyle: 'dashed',
                textTransform: 'none',
                mb: 2
              }}
            >
              <Box textAlign="center">
                <UploadFileIcon sx={{ fontSize: 40, color: '#667eea', mb: 1 }} />
                <Typography variant="body2">
                  Click to upload file
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Supports: PDF, DOC, DOCX, JPG, PNG, ZIP
                </Typography>
              </Box>
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                onChange={handleFileUpload}
              />
            </Button>
            
            {uploadFile && (
              <Paper sx={{ p: 2, bgcolor: '#f8f9ff' }}>
                <Typography variant="body2" fontWeight={500}>
                  Selected: {uploadFile.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Size: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setSubmitDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              alert('Assignment submitted successfully!');
              setSubmitDialogOpen(false);
              setUploadFile(null);
            }}
            disabled={!uploadFile}
            sx={{ 
              textTransform: 'none',
              bgcolor: '#667eea',
              '&:hover': { bgcolor: '#5568d3' }
            }}
          >
            Submit Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Academics;
