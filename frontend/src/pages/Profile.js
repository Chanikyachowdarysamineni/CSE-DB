import React, { useState, useContext } from 'react';
import { 
  Box, Typography, Card, CardContent, Button, Fade, Avatar, Switch, 
  FormControlLabel, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, Chip, Divider, Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { UserContext } from '../App';

const Profile = () => {
  const user = useContext(UserContext);
  const [darkMode, setDarkMode] = React.useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    email: '',
    registration_id: '',
    employee_id: '',
    phone: '',
    department: '',
    batch: '',
    role: ''
  });

  // Fetch user profile from database
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    
    fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(data => {
        setEditedProfile({
          name: data.name || '',
          email: data.email || '',
          registration_id: data.registration_id || '',
          employee_id: data.employee_id || '',
          phone: data.phone || '',
          department: data.department || 'Computer Science',
          batch: data.batch || '',
          role: data.role || 'Student'
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching profile:', err);
        setLoading(false);
      });
  }, []);

  // Calculate year from registration ID (first 2 digits)
  const calculateYearFromRegId = (regId) => {
    if (!regId || regId.length < 2) return 'N/A';
    const prefix = parseInt(regId.substring(0, 2));
    const currentYear = new Date().getFullYear();
    const currentYearSuffix = currentYear % 100;
    
    // Calculate year difference (25=1st, 24=2nd, 23=3rd, 22=4th)
    const yearDiff = currentYearSuffix - prefix;
    
    if (yearDiff === 0) return '1st Year';  // 25 in 2025
    if (yearDiff === 1) return '2nd Year';  // 24 in 2025
    if (yearDiff === 2) return '3rd Year';  // 23 in 2025
    if (yearDiff === 3) return '4th Year';  // 22 in 2025
    
    // For cases where student is beyond 4th year or in future batch
    if (yearDiff > 3) return 'Alumni/Past Year';
    return 'Future Batch';
  };

  const currentYear = editedProfile.role === 'Student' ? calculateYearFromRegId(editedProfile.registration_id) : 'N/A';

  const handleEditProfile = () => {
    setOpenEditDialog(true);
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedProfile)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('Profile updated successfully');
        setOpenEditDialog(false);
      } else {
        console.error('Failed to update profile');
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleCancelEdit = () => {
    setOpenEditDialog(false);
  };

  const getAvatarInitial = () => {
    return editedProfile.name?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>User Profile & Settings</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<EditIcon />}
          onClick={handleEditProfile}
        >
          Edit Profile
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information Card */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={700}>
            <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Profile Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mr: 3,
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getAvatarInitial()}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {editedProfile.name}
                    </Typography>
                    <Chip 
                      label={user?.role || 'Student'} 
                      color="primary" 
                      size="small" 
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {editedProfile.role === 'Student' ? 'Registration ID' : 'Employee ID'}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {editedProfile.role === 'Student' ? editedProfile.registration_id : editedProfile.employee_id || 'Not provided'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Email Address
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {editedProfile.email}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {editedProfile.phone || 'Not provided'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {editedProfile.department}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Current Year
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {currentYear}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Batch
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {editedProfile.batch}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Settings Card */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={700}>
            <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Settings & Preferences
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={darkMode} 
                      onChange={e => setDarkMode(e.target.checked)} 
                    />
                  } 
                  label="Dark Mode (Coming Soon)" 
                  sx={{ mb: 2 }}
                  disabled
                />

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Account Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Account Status
                    </Typography>
                    <Chip label="Active" color="success" size="small" />
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Member Since
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      November 2025
                    </Typography>
                  </Paper>

                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Privacy Settings
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    fullWidth
                  >
                    Change Password
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Academic Information Card */}
        <Grid item xs={12}>
          <Fade in timeout={700}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Academic Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" fontWeight={700}>
                        {currentYear}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Year
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" fontWeight={700}>
                        85%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Grade
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main" fontWeight={700}>
                        12
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Courses Enrolled
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCancelEdit} 
        maxWidth="sm" 
        fullWidth
        aria-labelledby="edit-profile-dialog-title"
        disableEnforceFocus
      >
        <DialogTitle id="edit-profile-dialog-title">Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full Name"
            value={editedProfile.name}
            onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={editedProfile.email}
            onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
            margin="normal"
            required
          />
          {editedProfile.role === 'Student' ? (
            <TextField
              fullWidth
              label="Registration ID"
              value={editedProfile.registration_id}
              onChange={(e) => {
                setEditedProfile({ ...editedProfile, registration_id: e.target.value });
              }}
              margin="normal"
              disabled
              helperText={`Format: YYxxxxxxx (e.g., 231fa04860, 231fa04a59) - First 2 digits: 22=4th yr, 23=3rd yr, 24=2nd yr, 25=1st yr - Current Year: ${calculateYearFromRegId(editedProfile.registration_id)}`}
            />
          ) : (
            <TextField
              fullWidth
              label="Employee ID"
              value={editedProfile.employee_id}
              onChange={(e) => {
                setEditedProfile({ ...editedProfile, employee_id: e.target.value });
              }}
              margin="normal"
            />
          )}
          <TextField
            fullWidth
            label="Phone Number"
            value={editedProfile.phone}
            onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
            margin="normal"
            placeholder="+91 XXXXX XXXXX"
          />
          <TextField
            fullWidth
            label="Department"
            value={editedProfile.department}
            onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
            margin="normal"
            required
          />
          {editedProfile.role === 'Student' && (
            <TextField
              fullWidth
              label="Batch"
              value={editedProfile.batch}
              onChange={(e) => setEditedProfile({ ...editedProfile, batch: e.target.value })}
              margin="normal"
              placeholder="2025-2029"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={
              !editedProfile.name || 
              !editedProfile.email || 
              !editedProfile.department
            }
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
