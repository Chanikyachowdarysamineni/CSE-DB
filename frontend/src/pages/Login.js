import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, MenuItem, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  React.useEffect(() => {
    if (location.state?.message) {
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location]);

  const roles = ['Student', 'Faculty', 'HOD', 'DEAN'];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }
      
      // Store user data and token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Call onLogin to update app state
      onLogin(data.user);
      
      // Navigate to dashboard
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default' 
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', m: 2 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom fontWeight={700}>
            CSE Department Portal
          </Typography>
          <Typography variant="h6" align="center" gutterBottom>
            Login
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
          
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              sx={{ mb: 3 }}
            >
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          
          <Box textAlign="center" sx={{ mt: 2 }}>
            <Button 
              color="primary" 
              onClick={() => navigate('/forgot-password')}
              sx={{ textTransform: 'none', fontSize: '0.875rem' }}
            >
              Forgot Password?
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }}>OR</Divider>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setEmail('student@cse.edu');
                setPassword('password123');
                setRole('Student');
              }}
            >
              Student Demo
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setEmail('faculty@cse.edu');
                setPassword('password123');
                setRole('Faculty');
              }}
            >
              Faculty Demo
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setEmail('hod@cse.edu');
                setPassword('password123');
                setRole('HOD');
              }}
            >
              HOD Demo
            </Button>
          </Box>
          
          {role === 'Student' && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box textAlign="center">
                <Typography variant="body2" color="textSecondary">
                  Don't have an account?{' '}
                  <Button 
                    color="primary" 
                    onClick={() => navigate('/register')}
                    sx={{ textTransform: 'none', fontWeight: 'bold', p: 0, minWidth: 0 }}
                  >
                    Register here
                  </Button>
                </Typography>
              </Box>
            </>
          )}

          <Typography variant="caption" color="textSecondary" textAlign="center" sx={{ mt: 2, display: 'block' }}>
            Use demo credentials above or any email from seeded database
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
