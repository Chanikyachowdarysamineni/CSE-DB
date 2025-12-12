import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Announcements from './pages/Announcements';
import Events from './pages/EventsNew';
import Academics from './pages/AcademicsNew';
import Projects from './pages/Projects';
import Forums from './pages/Forums';
import Forms from './pages/Forms';
import Resources from './pages/Resources';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import ManageContent from './pages/ManageContent';
import Layout from './components/Layout';
import AnimatedLoader from './components/AnimatedLoader';
import DeadlineNotifier from './components/DeadlineNotifier';
import NotificationAlert from './components/NotificationAlert';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';

// UserContext for role-based dashboard
export const UserContext = React.createContext({ role: 'Student', name: 'John Doe' });

function App() {
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Check if user is already logged in and validate token
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      
      // Validate token by fetching profile
      fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) {
            // Token is invalid or expired
            throw new Error('Invalid token');
          }
          return res.json();
        })
        .then(profileData => {
          // Update user data with fresh profile data
          const updatedUser = {
            id: profileData._id,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role,
            department: profileData.department,
            registration_id: profileData.registration_id,
            employee_id: profileData.employee_id
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setIsAuthenticated(true);
        })
        .catch(err => {
          console.log('Token validation failed, logging out:', err.message);
          // Clear invalid credentials
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <UserContext.Provider value={{ ...user, logout: handleLogout }}>
      <SocketProvider>
        <NotificationProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <DeadlineNotifier />
            <NotificationAlert />
            <Layout>
              {loading ? (
                <AnimatedLoader text="Loading dashboard..." />
              ) : (
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/announcements" element={<Announcements />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/academics" element={<Academics />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/forums" element={<Forums />} />
                  <Route path="/forms" element={<Forms />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/manage" element={<ManageContent />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              )}
            </Layout>
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </UserContext.Provider>
  );
}

export default App;
