const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Announcement = require('./models/Announcement');
const Event = require('./models/Event');
const { Assignment, Submission } = require('./models/Assignment');
const Project = require('./models/Project');
const Resource = require('./models/Resource');
const { Forum, Form } = require('./models/Forum');
const Notification = require('./models/Notification');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Announcement.deleteMany({});
    await Event.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Project.deleteMany({});
    await Resource.deleteMany({});
    await Forum.deleteMany({});
    await Form.deleteMany({});
    await Notification.deleteMany({});

    // Create users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const dean = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'dean@cse.edu',
      password_hash: hashedPassword,
      registration_id: 'DEAN001',
      role: 'DEAN',
      department: 'Computer Science',
      phone: '+91-9876543210',
      batch: null
    });

    const hod = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'hod@cse.edu',
      password_hash: hashedPassword,
      registration_id: 'HOD001',
      role: 'HOD',
      department: 'Computer Science',
      phone: '+91-9876543211'
    });

    const faculty1 = await User.create({
      name: 'Prof. Amit Verma',
      email: 'amit.verma@cse.edu',
      password_hash: hashedPassword,
      registration_id: 'FAC001',
      role: 'Faculty',
      department: 'Computer Science',
      phone: '+91-9876543212'
    });

    const faculty2 = await User.create({
      name: 'Dr. Sneha Patel',
      email: 'sneha.patel@cse.edu',
      password_hash: hashedPassword,
      registration_id: 'FAC002',
      role: 'Faculty',
      department: 'Computer Science',
      phone: '+91-9876543213'
    });

    const students = await User.insertMany([
      {
        name: 'Rahul Singh',
        email: 'rahul.singh@student.edu',
        password_hash: hashedPassword,
        registration_id: 'CSE2021001',
        role: 'Student',
        department: 'Computer Science',
        phone: '+91-9876543220',
        batch: '2021-2025'
      },
      {
        name: 'Priya Mehta',
        email: 'priya.mehta@student.edu',
        password_hash: hashedPassword,
        registration_id: 'CSE2021002',
        role: 'Student',
        department: 'Computer Science',
        phone: '+91-9876543221',
        batch: '2021-2025'
      },
      {
        name: 'Arjun Reddy',
        email: 'arjun.reddy@student.edu',
        password_hash: hashedPassword,
        registration_id: 'CSE2021003',
        role: 'Student',
        department: 'Computer Science',
        phone: '+91-9876543222',
        batch: '2021-2025'
      },
      {
        name: 'Ananya Iyer',
        email: 'ananya.iyer@student.edu',
        password_hash: hashedPassword,
        registration_id: 'CSE2022001',
        role: 'Student',
        department: 'Computer Science',
        phone: '+91-9876543223',
        batch: '2022-2026'
      },
      {
        name: 'Vikram Joshi',
        email: 'vikram.joshi@student.edu',
        password_hash: hashedPassword,
        registration_id: 'CSE2022002',
        role: 'Student',
        department: 'Computer Science',
        phone: '+91-9876543224',
        batch: '2022-2026'
      }
    ]);

    console.log('✓ Users created');

    // Create announcements
    console.log('Creating announcements...');
    await Announcement.insertMany([
      {
        title: 'Winter Break Schedule',
        body: 'The winter break will commence from December 20, 2025. Classes will resume on January 6, 2026. All pending assignments must be submitted before the break.',
        priority: 'high',
        expiry: new Date('2025-12-20'),
        status: 'approved',
        sender_id: hod._id,
        subject_name: 'General',
        subject_code: 'GEN'
      },
      {
        title: 'Guest Lecture on AI & Machine Learning',
        body: 'We are pleased to announce a guest lecture by Dr. Sundar Pichai on "Future of AI" on December 10, 2025 at 2:00 PM in the Main Auditorium.',
        priority: 'medium',
        expiry: new Date('2025-12-10'),
        status: 'approved',
        sender_id: faculty1._id,
        subject_name: 'Artificial Intelligence',
        subject_code: 'CSE502'
      },
      {
        title: 'Library Hours Extended',
        body: 'Due to approaching exams, library hours have been extended. The library will now be open from 7:00 AM to 11:00 PM on all weekdays.',
        priority: 'low',
        expiry: new Date('2025-12-31'),
        status: 'approved',
        sender_id: dean._id,
        subject_name: 'General',
        subject_code: 'GEN'
      }
    ]);
    console.log('✓ Announcements created');

    // Create events
    console.log('Creating events...');
    await Event.insertMany([
      {
        title: 'Hackathon 2025',
        description: '24-hour coding challenge. Build innovative solutions and win exciting prizes!',
        date: new Date('2025-12-15T09:00:00'),
        type: 'Hackathon',
        venue: 'Computer Lab 1',
        capacity: 100,
        attendees: 85,
        recurring: false,
        created_by: faculty1._id,
        subject_name: 'Programming',
        subject_code: 'CSE101',
        status: 'approved'
      },
      {
        title: 'Tech Talk: Cloud Computing',
        description: 'Industry expert talk on modern cloud architectures and DevOps practices.',
        date: new Date('2025-12-08T14:00:00'),
        type: 'Seminar',
        venue: 'Auditorium',
        capacity: 200,
        attendees: 150,
        recurring: false,
        created_by: faculty2._id,
        subject_name: 'Cloud Computing',
        subject_code: 'CSE601',
        status: 'approved'
      },
      {
        title: 'Annual Tech Fest',
        description: 'Three-day technical festival featuring workshops, competitions, and exhibitions.',
        date: new Date('2025-12-20T10:00:00'),
        type: 'Department Event',
        venue: 'Main Campus',
        capacity: 500,
        attendees: 320,
        recurring: false,
        created_by: hod._id,
        subject_name: 'General',
        subject_code: 'EVENT',
        status: 'approved'
      }
    ]);
    console.log('✓ Events created');

    // Create assignments
    console.log('Creating assignments...');
    const assignments = await Assignment.insertMany([
      {
        title: 'Database Design Assignment',
        description: 'Design a normalized database schema for an e-commerce application. Include ER diagram and table definitions.',
        deadline: new Date('2025-12-10T23:59:00'),
        type: 'Assignment',
        subject_name: 'Database Management Systems',
        subject_code: 'CSE401',
        created_by: faculty1._id,
        status: 'approved'
      },
      {
        title: 'Machine Learning Model Implementation',
        description: 'Implement and train a classification model using scikit-learn. Submit Jupyter notebook with results.',
        deadline: new Date('2025-12-15T23:59:00'),
        type: 'Assignment',
        subject_name: 'Machine Learning',
        subject_code: 'CSE503',
        created_by: faculty2._id,
        status: 'approved'
      },
      {
        title: 'Web Development Project',
        description: 'Create a responsive web application using React and Node.js. Must include authentication and CRUD operations.',
        deadline: new Date('2025-12-20T23:59:00'),
        type: 'Assignment',
        subject_name: 'Web Technologies',
        subject_code: 'CSE302',
        created_by: faculty1._id,
        status: 'approved'
      }
    ]);
    console.log('✓ Assignments created');

    // Create submissions
    console.log('Creating submissions...');
    await Submission.insertMany([
      {
        assignment_id: assignments[0]._id,
        student_id: students[0]._id,
        file_name: 'database_design_rahul.pdf',
        file_size: 2048576,
        submitted_at: new Date('2025-12-08T18:30:00'),
        is_late: false,
        resubmissions: 0,
        grade: 'A',
        feedback: 'Excellent work! Well-structured schema.'
      },
      {
        assignment_id: assignments[0]._id,
        student_id: students[1]._id,
        file_name: 'database_design_priya.pdf',
        file_size: 1536000,
        submitted_at: new Date('2025-12-09T20:15:00'),
        is_late: false,
        resubmissions: 0,
        grade: 'A-',
        feedback: 'Good design, minor improvements needed.'
      }
    ]);
    console.log('✓ Submissions created');

    // Create projects
    console.log('Creating projects...');
    await Project.insertMany([
      {
        title: 'Smart Attendance System',
        description: 'Develop a facial recognition-based attendance system with real-time tracking and analytics.',
        deadline: new Date('2025-12-25T23:59:00'),
        due_date: new Date('2025-12-25T23:59:00'),
        subject_name: 'Software Engineering',
        subject_code: 'CSE404',
        requirements: ['Facial recognition module', 'Database integration', 'Report generation', 'User authentication'],
        team_members: ['Rahul Singh', 'Priya Mehta', 'Arjun Reddy'],
        progress: 75,
        milestone: 'Testing Phase',
        evaluated: false,
        created_by: faculty1._id,
        status: 'approved'
      },
      {
        title: 'AI Chatbot for Student Queries',
        description: 'Build an intelligent chatbot using NLP to answer student queries about courses, schedules, and campus facilities.',
        deadline: new Date('2025-12-30T23:59:00'),
        due_date: new Date('2025-12-30T23:59:00'),
        subject_name: 'Artificial Intelligence',
        subject_code: 'CSE502',
        requirements: ['NLP integration', 'Knowledge base', 'Chat interface', 'Analytics dashboard'],
        team_members: ['Ananya Iyer', 'Vikram Joshi'],
        progress: 60,
        milestone: 'Development',
        evaluated: false,
        created_by: faculty2._id,
        status: 'approved'
      }
    ]);
    console.log('✓ Projects created');

    // Create resources
    console.log('Creating resources...');
    await Resource.insertMany([
      {
        name: 'DBMS Lecture Notes - Module 1',
        type: 'PDF',
        folder: 'DBMS',
        subject_name: 'Database Management Systems',
        subject_code: 'CSE401',
        version: 'v1.2',
        link: 'https://drive.google.com/file/dbms-module1',
        downloads: 145,
        expiry_date: new Date('2026-06-30'),
        uploaded_by: faculty1._id,
        status: 'approved'
      },
      {
        name: 'Machine Learning Algorithms Cheat Sheet',
        type: 'PDF',
        folder: 'ML',
        subject_name: 'Machine Learning',
        subject_code: 'CSE503',
        version: 'v2.0',
        link: 'https://drive.google.com/file/ml-cheatsheet',
        downloads: 230,
        expiry_date: new Date('2026-06-30'),
        uploaded_by: faculty2._id,
        status: 'approved'
      },
      {
        name: 'React.js Tutorial Video Series',
        type: 'Link',
        folder: 'Web Dev',
        subject_name: 'Web Technologies',
        subject_code: 'CSE302',
        version: 'v1.0',
        link: 'https://youtube.com/playlist/react-tutorials',
        downloads: 89,
        expiry_date: new Date('2026-12-31'),
        uploaded_by: faculty1._id,
        status: 'approved'
      }
    ]);
    console.log('✓ Resources created');

    // Create forums
    console.log('Creating forums...');
    await Forum.insertMany([
      {
        topic: 'Help with SQL Joins',
        content: 'Can someone explain the difference between INNER JOIN and LEFT JOIN with examples?',
        category: 'Doubt',
        upvotes: 15,
        accepted: true,
        anonymous: false,
        created_by: students[0]._id,
        replies: [
          {
            content: 'INNER JOIN returns only matching rows from both tables, while LEFT JOIN returns all rows from the left table and matching rows from the right table.',
            created_by: faculty1._id,
            created_at: new Date('2025-11-25T10:30:00')
          }
        ]
      },
      {
        topic: 'Best practices for React state management?',
        content: 'What are the pros and cons of using Redux vs Context API for state management in large React applications?',
        category: 'Discussion',
        upvotes: 23,
        accepted: false,
        anonymous: false,
        created_by: students[2]._id,
        replies: []
      }
    ]);
    console.log('✓ Forums created');

    // Create forms
    console.log('Creating forms...');
    await Form.insertMany([
      {
        title: 'Course Feedback - Database Management',
        category: 'Feedback',
        subject_name: 'Database Management Systems',
        subject_code: 'CSE401',
        google_form_link: 'https://forms.google.com/dbms-feedback',
        google_sheet_link: 'https://sheets.google.com/dbms-responses',
        responses: 87,
        expiry_date: new Date('2025-12-15'),
        created_by: faculty1._id,
        status: 'approved'
      },
      {
        title: 'Internship Interest Survey',
        category: 'Survey',
        subject_name: 'Career Development',
        subject_code: 'GEN',
        google_form_link: 'https://forms.google.com/internship-survey',
        google_sheet_link: 'https://sheets.google.com/internship-responses',
        responses: 142,
        expiry_date: new Date('2025-12-20'),
        created_by: hod._id,
        status: 'approved'
      },
      {
        title: 'Lab Equipment Requisition Form',
        category: 'Request',
        subject_name: 'Laboratory',
        subject_code: 'LAB',
        google_form_link: 'https://forms.google.com/lab-requisition',
        responses: 23,
        expiry_date: new Date('2025-12-31'),
        created_by: faculty2._id,
        status: 'approved'
      }
    ]);
    console.log('✓ Forms created');

    // Create notifications
    console.log('Creating notifications...');
    const notificationPromises = students.map(student => 
      Notification.insertMany([
        {
          recipient_id: student._id,
          title: 'New Assignment Posted',
          message: 'Database Design Assignment has been posted. Deadline: Dec 10, 2025',
          type: 'assignment',
          priority: 'high',
          read: false,
          channel: 'In-app',
          link: '/academics'
        },
        {
          recipient_id: student._id,
          title: 'Upcoming Event: Hackathon 2025',
          message: '24-hour coding challenge on Dec 15. Register now!',
          type: 'event',
          priority: 'medium',
          read: false,
          channel: 'In-app',
          link: '/events'
        },
        {
          recipient_id: student._id,
          title: 'New Resource Available',
          message: 'DBMS Lecture Notes - Module 1 has been uploaded',
          type: 'resource',
          priority: 'low',
          read: true,
          channel: 'In-app',
          link: '/resources'
        }
      ])
    );
    await Promise.all(notificationPromises);
    console.log('✓ Notifications created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Announcements: ${await Announcement.countDocuments()}`);
    console.log(`   Events: ${await Event.countDocuments()}`);
    console.log(`   Assignments: ${await Assignment.countDocuments()}`);
    console.log(`   Submissions: ${await Submission.countDocuments()}`);
    console.log(`   Projects: ${await Project.countDocuments()}`);
    console.log(`   Resources: ${await Resource.countDocuments()}`);
    console.log(`   Forums: ${await Forum.countDocuments()}`);
    console.log(`   Forms: ${await Form.countDocuments()}`);
    console.log(`   Notifications: ${await Notification.countDocuments()}`);

    console.log('\n👤 Test Credentials (All passwords: password123):');
    console.log('   DEAN: dean@cse.edu');
    console.log('   HOD: hod@cse.edu');
    console.log('   Faculty: amit.verma@cse.edu / sneha.patel@cse.edu');
    console.log('   Student: rahul.singh@student.edu');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
};

seedDatabase();
