import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PersonAdd } from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Student Information
    registrationId: '',
    department: 'CSE',
    semester: '1',
    section: 'A',
    phoneNumber: '',
    
    // Academic Details
    currentYear: '1',
    batch: '2025',
    category: 'General'
  });

  const steps = ['Personal Information', 'Student Details', 'Academic Information'];

  const departments = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const sections = ['A', 'B', 'C', 'D'];
  const categories = ['General', 'OBC', 'SC', 'ST', 'EWS'];

  const calculateYearFromRegId = (regId) => {
    if (regId.length < 2) return null;
    const yearPrefix = regId.substring(0, 2);
    const currentYear = new Date().getFullYear();
    const currentYearSuffix = currentYear % 100;
    
    // Calculate year difference (25=1st, 24=2nd, 23=3rd, 22=4th)
    const yearDiff = currentYearSuffix - parseInt(yearPrefix);
    
    // Calculate which year they are in
    if (yearDiff === 0) return '1'; // 25 in 2025 = 1st year
    if (yearDiff === 1) return '2'; // 24 in 2025 = 2nd year
    if (yearDiff === 2) return '3'; // 23 in 2025 = 3rd year
    if (yearDiff === 3) return '4'; // 22 in 2025 = 4th year
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };
    
    // Auto-calculate year and semester when registration ID is entered
    if (name === 'registrationId' && value.length >= 2) {
      const calculatedYear = calculateYearFromRegId(value);
      if (calculatedYear) {
        updates.currentYear = calculatedYear;
        updates.batch = '20' + value.substring(0, 2);
        
        // Auto-calculate semester based on year
        // July-December = odd semester (1, 3, 5, 7)
        // January-June = even semester (2, 4, 6, 8)
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const isOddSemester = currentMonth >= 7 && currentMonth <= 12; // July-Dec = odd sem
        
        const yearNum = parseInt(calculatedYear);
        if (isOddSemester) {
          // Odd semesters: 1, 3, 5, 7
          updates.semester = ((yearNum - 1) * 2 + 1).toString();
        } else {
          // Even semesters: 2, 4, 6, 8
          updates.semester = (yearNum * 2).toString();
        }
      }
    }
    
    setFormData({
      ...formData,
      ...updates
    });
    setError('');
  };

  const validateStep = (step) => {
    switch(step) {
      case 0:
        if (!formData.fullName || !formData.email || !formData.password) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        break;
      case 1:
        if (!formData.registrationId || !formData.phoneNumber) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.registrationId.length < 10 || formData.registrationId.length > 11) {
          setError('Registration ID must be 10-11 characters (e.g., 231fa04860, 231fa04a59)');
          return false;
        }
        const regIdPattern = /^[0-9]{2}[a-zA-Z0-9]{7,9}$/;
        if (!regIdPattern.test(formData.registrationId)) {
          setError('Invalid Registration ID format. First 2 digits must be year (e.g., 23)');
          return false;
        }
        if (formData.phoneNumber.length !== 10) {
          setError('Phone number must be 10 digits');
          return false;
        }
        break;
      case 2:
        if (!formData.currentYear || !formData.batch) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      default:
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          registration_id: formData.registrationId,
          department: formData.department,
          phone: formData.phoneNumber,
          batch: formData.batch,
          role: 'Student'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save token and user data
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        setSuccess(true);
        setTimeout(() => {
          // Redirect to dashboard instead of login since they're already authenticated
          navigate('/dashboard');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || data.details || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const renderStepContent = (step) => {
    switch(step) {
      case 0:
        return (
          <Box>
            <TextField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              helperText="Use your college email"
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              helperText="Minimum 6 characters"
            />
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <TextField
              label="Registration ID"
              name="registrationId"
              value={formData.registrationId}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              placeholder="e.g., 231fa04860, 231fa04a59"
              helperText="First 2 digits indicate year: 22=4th yr, 23=3rd yr, 24=2nd yr, 25=1st yr"
              inputProps={{ maxLength: 11 }}
            />
            <TextField
              select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            >
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </TextField>
            <Box display="flex" gap={2}>
              <TextField
                select
                label="Semester"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                disabled
                helperText="Auto-calculated from Registration ID"
              >
                {semesters.map((sem) => (
                  <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              >
                {sections.map((sec) => (
                  <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              placeholder="10-digit mobile number"
              inputProps={{ maxLength: 10 }}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <TextField
              select
              label="Current Year"
              name="currentYear"
              value={formData.currentYear}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              disabled
              helperText="Auto-calculated from Registration ID"
            >
              <MenuItem value="1">1st Year</MenuItem>
              <MenuItem value="2">2nd Year</MenuItem>
              <MenuItem value="3">3rd Year</MenuItem>
              <MenuItem value="4">4th Year</MenuItem>
            </TextField>
            <TextField
              label="Batch Year"
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              placeholder="e.g., 2025"
            />
            <TextField
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> After registration, your account will be activated within 24 hours. 
                You will receive a confirmation email once approved.
              </Typography>
            </Alert>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 3
      }}
    >
      <Card 
        elevation={10} 
        sx={{ 
          maxWidth: 600, 
          width: '100%',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
            <PersonAdd sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" fontWeight={700} color="primary">
              Student Registration
            </Typography>
          </Box>

          <Typography variant="body2" color="textSecondary" textAlign="center" mb={3}>
            Register to access the CSE Department Portal
          </Typography>

          {success ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              Registration successful! Redirecting to login...
            </Alert>
          ) : (
            <>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {renderStepContent(activeStep)}

              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>
                
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    size="large"
                  >
                    Register
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    size="large"
                  >
                    Next
                  </Button>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box textAlign="center">
                <Typography variant="body2" color="textSecondary">
                  Already have an account?{' '}
                  <Button 
                    color="primary" 
                    onClick={() => navigate('/login')}
                    sx={{ textTransform: 'none' }}
                  >
                    Login here
                  </Button>
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
