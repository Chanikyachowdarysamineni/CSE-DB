import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { setupBroadcastListener } from '../utils/notificationBroadcast';
import { useSocket } from './SocketContext';
import fetchWithAuth from '../utils/api';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useContext(UserContext);
  const { on, off, connected } = useSocket();

  // Fetch notifications from database
  const fetchNotifications = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const res = await fetchWithAuth('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  }, [user?.id]);

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Add notification function - wrapped in useCallback to prevent dependency issues
  const addNotification = React.useCallback((notification) => {
    const newNotif = {
      id: Date.now() + Math.random(),
      ...notification,
      read: false,
      timestamp: new Date().toISOString(),
      channel: 'In-app'
    };

    setNotifications(prev => {
      // Check for duplicates
      const isDuplicate = prev.some(n => 
        n.title === newNotif.title && 
        n.message === newNotif.message &&
        new Date(n.timestamp).getTime() > Date.now() - 60000 // Within last minute
      );
      
      if (isDuplicate) return prev;
      
      return [newNotif, ...prev].slice(0, 100); // Keep only last 100
    });
    
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotif.title, {
        body: newNotif.message,
        icon: '/logo.png',
        badge: '/logo.png'
      });
    }
  }, []);

  // Real-time notification listeners
  useEffect(() => {
    if (!connected || !user?.id) return;

    const handleNewNotification = (notification) => {
      const newNotif = {
        ...notification,
        id: notification._id || notification.id,
        timestamp: notification.created_at || notification.timestamp
      };

      setNotifications(prev => {
        // Check for duplicates by ID or by title+message+timestamp
        const isDuplicate = prev.some(n => {
          const sameId = (n.id === newNotif.id || n._id === newNotif._id);
          const sameContent = n.title === newNotif.title && 
                             n.message === newNotif.message &&
                             Math.abs(new Date(n.timestamp).getTime() - new Date(newNotif.timestamp).getTime()) < 5000;
          return sameId || sameContent;
        });

        if (isDuplicate) {
          console.log('Duplicate notification prevented:', newNotif.title);
          return prev;
        }

        return [newNotif, ...prev].slice(0, 100);
      });

      // Only increment if not duplicate
      if (!newNotif.read) {
        setUnreadCount(prev => prev + 1);
      }

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/logo.png',
          badge: '/logo.png'
        });
      }
    };

    // Listen for various content updates
    const handleNewAnnouncement = (announcement) => {
      if (user.role === 'Student' && announcement.status === 'approved') {
        handleNewNotification({
          id: `announcement-${announcement._id || announcement.id}-${Date.now()}`,
          title: '📢 New Announcement',
          message: announcement.title,
          type: 'announcement',
          link: '/announcements',
          priority: 'high',
          read: false
        });
      }
    };

    const handleNewEvent = (event) => {
      if (user.role === 'Student') {
        handleNewNotification({
          id: `event-${event._id || event.id}-${Date.now()}`,
          title: '📅 New Event',
          message: event.title,
          type: 'event',
          link: '/events',
          priority: 'medium',
          read: false
        });
      }
    };

    const handleNewAssignment = (assignment) => {
      if (user.role === 'Student' && assignment.status === 'approved') {
        handleNewNotification({
          id: `assignment-${assignment._id || assignment.id}-${Date.now()}`,
          title: '📚 New Assignment',
          message: `${assignment.title} - Due: ${new Date(assignment.deadline).toLocaleDateString()}`,
          type: 'assignment',
          link: '/academics',
          priority: 'high',
          read: false
        });
      }
    };

    const handleNewProject = (project) => {
      if (user.role === 'Student') {
        handleNewNotification({
          id: `project-${project._id || project.id}-${Date.now()}`,
          title: '🚀 New Project',
          message: project.title,
          type: 'project',
          link: '/projects',
          priority: 'high',
          read: false
        });
      }
    };

    const handleNewResource = (resource) => {
      if (user.role === 'Student') {
        handleNewNotification({
          id: `resource-${resource._id || resource.id}-${Date.now()}`,
          title: '📚 New Resource',
          message: resource.name || resource.title,
          type: 'resource',
          link: '/resources',
          priority: 'medium',
          read: false
        });
      }
    };

    const handleNewForm = (form) => {
      if (user.role === 'Student') {
        handleNewNotification({
          id: `form-${form._id || form.id}-${Date.now()}`,
          title: '📋 New Form',
          message: form.title,
          type: 'form',
          link: '/forms',
          priority: 'medium',
          read: false
        });
      }
    };

    const handleNewForum = (forum) => {
      if (user.role === 'Student') {
        handleNewNotification({
          id: `forum-${forum._id || forum.id}-${Date.now()}`,
          title: '💬 New Forum Thread',
          message: forum.title,
          type: 'forum',
          link: '/forums',
          priority: 'low',
          read: false
        });
      }
    };

    on('notification:new', handleNewNotification);
    on('announcement:new', handleNewAnnouncement);
    on('announcement:updated', handleNewAnnouncement);
    on('event:new', handleNewEvent);
    on('assignment:new', handleNewAssignment);
    on('project:new', handleNewProject);
    on('resource:new', handleNewResource);
    on('form:new', handleNewForm);
    on('forum:new', handleNewForum);

    return () => {
      off('notification:new', handleNewNotification);
      off('announcement:new', handleNewAnnouncement);
      off('announcement:updated', handleNewAnnouncement);
      off('event:new', handleNewEvent);
      off('assignment:new', handleNewAssignment);
      off('project:new', handleNewProject);
      off('resource:new', handleNewResource);
      off('form:new', handleNewForm);
      off('forum:new', handleNewForum);
    };
  }, [connected, user, on, off]);

  const getItemLink = (type, id) => {
    const linkMap = {
      'Announcement': '/announcements',
      'Assignment': '/academics',
      'Project': '/projects',
      'Event': '/events',
      'Form': '/forms',
      'Resource': '/resources'
    };
    return linkMap[type] || '/';
  };

  const markAsRead = React.useCallback(async (id) => {
    try {
      await fetchWithAuth(`/api/notifications/${id}/read`, {
        method: 'PUT'
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === id || n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark as read:', err);
    }
  }, []);

  const markAllAsRead = React.useCallback(async () => {
    try {
      await fetchWithAuth('/api/notifications/read-all', {
        method: 'PUT'
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  }, []);

  const deleteNotification = React.useCallback(async (id) => {
    try {
      await fetchWithAuth(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      
      setNotifications(prev => {
        const notif = prev.find(n => (n.id === id || n._id === id));
        if (notif && !notif.read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return prev.filter(n => n.id !== id && n._id !== id);
      });
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  }, []);

  const clearAll = React.useCallback(async () => {
    try {
      await fetchWithAuth('/api/notifications/clear-all', {
        method: 'DELETE'
      });
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to clear all notifications:', err);
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Listen for broadcast notifications from content creation
  useEffect(() => {
    if (user?.role === 'Student') {
      const cleanup = setupBroadcastListener(addNotification);
      return cleanup;
    }
  }, [user?.role, addNotification]);

  const value = React.useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, deleteNotification, clearAll]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};