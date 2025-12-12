// Helper function to broadcast new content notifications
// This should be called after successfully creating content in any module

export const broadcastContentNotification = (contentType, contentData, userRole) => {
  // Only broadcast if posted by Faculty, HOD, or DEAN
  if (!['Faculty', 'HOD', 'DEAN'].includes(userRole)) {
    return;
  }

  // Create notification event
  const notification = {
    title: `New ${contentType} Posted`,
    message: `${contentData.title || contentData.name}: ${(contentData.body || contentData.description || '').substring(0, 100)}...`,
    type: contentType.toLowerCase(),
    priority: contentData.priority || 'medium',
    itemId: contentData.id,
    timestamp: new Date().toISOString(),
    channel: 'In-app',
    read: false
  };

  // Broadcast to all students via localStorage event
  const event = new CustomEvent('newContentPosted', {
    detail: notification
  });
  
  window.dispatchEvent(event);

  // Also store in a temporary broadcast storage that other tabs can read
  const broadcasts = JSON.parse(localStorage.getItem('contentBroadcasts') || '[]');
  broadcasts.push(notification);
  
  // Keep only last 50 broadcasts
  if (broadcasts.length > 50) {
    broadcasts.shift();
  }
  
  localStorage.setItem('contentBroadcasts', JSON.stringify(broadcasts));
  
  // Trigger storage event for other tabs
  window.dispatchEvent(new Event('storage'));

  return notification;
};

// Listen for broadcasts in NotificationContext
export const setupBroadcastListener = (addNotification) => {
  const handleNewContent = (event) => {
    if (event.detail) {
      addNotification(event.detail);
    }
  };

  const handleStorageChange = () => {
    const broadcasts = JSON.parse(localStorage.getItem('contentBroadcasts') || '[]');
    const lastBroadcast = broadcasts[broadcasts.length - 1];
    
    if (lastBroadcast) {
      // Check if we've already seen this broadcast
      const lastSeen = localStorage.getItem('lastSeenBroadcast');
      const broadcastTime = new Date(lastBroadcast.timestamp).getTime();
      
      if (!lastSeen || broadcastTime > parseInt(lastSeen)) {
        addNotification(lastBroadcast);
        localStorage.setItem('lastSeenBroadcast', broadcastTime.toString());
      }
    }
  };

  window.addEventListener('newContentPosted', handleNewContent);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('newContentPosted', handleNewContent);
    window.removeEventListener('storage', handleStorageChange);
  };
};
