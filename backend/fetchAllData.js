const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Announcement = require('./models/Announcement');
const Event = require('./models/Event');
const { Assignment, Submission } = require('./models/Assignment');
const Project = require('./models/Project');
const Resource = require('./models/Resource');
const { Forum, Form } = require('./models/Forum');
const Notification = require('./models/Notification');

async function fetchAllData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch Users
    console.log('='.repeat(60));
    console.log('USERS');
    console.log('='.repeat(60));
    const users = await User.find().select('-password_hash');
    console.log(`Total: ${users.length}`);
    users.forEach(u => console.log(`- ${u.name} (${u.email}) - ${u.role}`));

    // Fetch Announcements
    console.log('\n' + '='.repeat(60));
    console.log('ANNOUNCEMENTS');
    console.log('='.repeat(60));
    const announcements = await Announcement.find().populate('sender_id', 'name role');
    console.log(`Total: ${announcements.length}`);
    announcements.forEach(a => console.log(`- ${a.title} [${a.priority}] by ${a.sender_id?.name}`));

    // Fetch Events
    console.log('\n' + '='.repeat(60));
    console.log('EVENTS');
    console.log('='.repeat(60));
    const events = await Event.find().populate('created_by', 'name');
    console.log(`Total: ${events.length}`);
    events.forEach(e => console.log(`- ${e.title} on ${e.date?.toDateString()} at ${e.venue}`));

    // Fetch Assignments
    console.log('\n' + '='.repeat(60));
    console.log('ASSIGNMENTS');
    console.log('='.repeat(60));
    const assignments = await Assignment.find().populate('created_by', 'name');
    console.log(`Total: ${assignments.length}`);
    assignments.forEach(a => console.log(`- ${a.title} - Due: ${a.deadline?.toDateString()}`));

    // Fetch Submissions
    console.log('\n' + '='.repeat(60));
    console.log('SUBMISSIONS');
    console.log('='.repeat(60));
    const submissions = await Submission.find().populate('student_id', 'name').populate('assignment_id', 'title');
    console.log(`Total: ${submissions.length}`);
    submissions.forEach(s => console.log(`- ${s.student_id?.name} submitted ${s.assignment_id?.title} ${s.is_late ? '(LATE)' : ''}`));

    // Fetch Projects
    console.log('\n' + '='.repeat(60));
    console.log('PROJECTS');
    console.log('='.repeat(60));
    const projects = await Project.find().populate('created_by', 'name');
    console.log(`Total: ${projects.length}`);
    projects.forEach(p => console.log(`- ${p.title} (${p.progress}% complete)`));

    // Fetch Resources
    console.log('\n' + '='.repeat(60));
    console.log('RESOURCES');
    console.log('='.repeat(60));
    const resources = await Resource.find().populate('uploaded_by', 'name');
    console.log(`Total: ${resources.length}`);
    resources.forEach(r => console.log(`- ${r.title} [${r.type}] by ${r.uploaded_by?.name}`));

    // Fetch Forums
    console.log('\n' + '='.repeat(60));
    console.log('FORUMS');
    console.log('='.repeat(60));
    const forums = await Forum.find().populate('created_by', 'name');
    console.log(`Total: ${forums.length}`);
    forums.forEach(f => console.log(`- ${f.title} (${f.replies?.length || 0} replies)`));

    // Fetch Forms
    console.log('\n' + '='.repeat(60));
    console.log('FORMS');
    console.log('='.repeat(60));
    const forms = await Form.find().populate('created_by', 'name');
    console.log(`Total: ${forms.length}`);
    forms.forEach(f => console.log(`- ${f.title} by ${f.created_by?.name}`));

    // Fetch Notifications
    console.log('\n' + '='.repeat(60));
    console.log('NOTIFICATIONS');
    console.log('='.repeat(60));
    const notifications = await Notification.find();
    console.log(`Total: ${notifications.length}`);
    notifications.forEach(n => console.log(`- ${n.message} [${n.type}] ${n.read ? '✓' : '○'}`));

    console.log('\n' + '='.repeat(60));
    console.log('✅ Data fetch complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fetchAllData();
