// Initialize all tables for the CSE Department platform
const { createUserTable } = require('./models/User');
const { createAnnouncementTable } = require('./models/Announcement');
const { createEventTable } = require('./models/Event');
const { createAssignmentTable } = require('./models/Assignment');
const { createProjectTable } = require('./models/Project');
const { createForumTable } = require('./models/Forum');
const { createResourceTable } = require('./models/Resource');
const { createNotificationTable } = require('./models/Notification');
const { createAnalyticsTable } = require('./models/Analytics');

(async () => {
  await createUserTable();
  await createAnnouncementTable();
  await createEventTable();
  await createAssignmentTable();
  await createProjectTable();
  await createForumTable();
  await createResourceTable();
  await createNotificationTable();
  await createAnalyticsTable();
  console.log('All tables initialized.');
})();
