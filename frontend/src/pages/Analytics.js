import React, { useContext } from 'react';
import { Box, Typography, Grid, Card, CardContent, Fade, Button, LinearProgress, Alert, CircularProgress, Chip } from '@mui/material';
import { UserContext } from '../App';
import fetchWithAuth from '../utils/api';

const Analytics = () => {
  const { user } = useContext(UserContext);
  const [analytics, setAnalytics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  // Only HOD and DEAN can access analytics
  const hasAccess = user && ['HOD', 'DEAN'].includes(user.role);

  // Fetch analytics data
  React.useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    fetchWithAuth('/api/analytics')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching analytics:', err);
        setLoading(false);
      });
  }, [hasAccess]);
  
  if (!hasAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access Denied: Only HOD and DEAN can view analytics.
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
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>📊 Analytics & Reporting</Typography>
        <Typography variant="body2" color="text.secondary">Department statistics, engagement metrics, and performance insights</Typography>
      </Box>
      
      {analytics && (
        <Grid container spacing={3}>
          {/* Total Stats */}
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Students</Typography>
                <Typography variant="h3" color="primary">{analytics.totalStudents || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Faculty</Typography>
                <Typography variant="h3" color="secondary">{analytics.totalFaculty || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Assignments</Typography>
                <Typography variant="h3" color="success.main">{analytics.activeAssignments || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pending Approvals</Typography>
                <Typography variant="h3" color="warning.main">{analytics.pendingApprovals || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Engagement Metrics */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={700}>
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6">Announcement Engagement</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>Average engagement rate for department announcements</Typography>
                  <LinearProgress variant="determinate" value={analytics.announcementEngagement || 0} sx={{ height: 8, borderRadius: 5 }} />
                  <Typography variant="body2" sx={{ mt: 1 }}>{analytics.announcementEngagement || 0}%</Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Fade in timeout={700}>
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6">Assignment Submission Rate</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>Percentage of on-time submissions</Typography>
                  <LinearProgress variant="determinate" value={analytics.submissionRate || 0} sx={{ height: 8, borderRadius: 5 }} color="success" />
                  <Typography variant="body2" sx={{ mt: 1 }}>{analytics.submissionRate || 0}%</Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Export Options */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Export Reports</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                  <Button variant="contained" color="primary">Export Student Data</Button>
                  <Button variant="contained" color="secondary">Export Assignment Reports</Button>
                  <Button variant="outlined">Export Attendance</Button>
                  <Button variant="outlined">Export Analytics Summary</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;
