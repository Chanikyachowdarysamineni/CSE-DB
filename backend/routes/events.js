const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Event = require('../models/Event');

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role === 'Student') {
      // Students see only approved events
      query = { status: 'approved' };
    } else if (role === 'Faculty') {
      // Faculty see their own + approved
      query = { $or: [{ created_by: id }, { status: 'approved' }] };
    }
    // HOD/DEAN see all (no filter)

    const events = await Event.find(query)
      .populate('created_by', 'name email role')
      .sort({ date: -1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('created_by', 'name email role');
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event
router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { 
      title, description, date, venue, capacity, recurring, 
      google_calendar_link, subject_name, subject_code 
    } = req.body;
    
    // Validate required fields
    if (!title || !date || !venue) {
      return res.status(400).json({ error: 'Title, date, and venue are required' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      venue,
      capacity,
      recurring: recurring || false,
      google_calendar_link,
      subject_name,
      subject_code,
      created_by: req.user.id
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('event:new', event);
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, date, venue, capacity, recurring, 
      google_calendar_link, subject_name, subject_code 
    } = req.body;
    
    // For Faculty, check ownership
    if (req.user.role === 'Faculty') {
      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (event.created_by.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to edit this event' });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (date) updateData.date = date;
    if (venue) updateData.venue = venue;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (recurring !== undefined) updateData.recurring = recurring;
    if (google_calendar_link) updateData.google_calendar_link = google_calendar_link;
    if (subject_name) updateData.subject_name = subject_name;
    if (subject_code) updateData.subject_code = subject_code;

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Register for event
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const attendees = event.attendees || [];
    const waitlist = event.waitlist || [];

    // Check if already registered
    if (attendees.includes(userId) || waitlist.includes(userId)) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    // Add to attendees or waitlist
    if (attendees.length < event.capacity) {
      attendees.push(userId);
      await Event.findByIdAndUpdate(id, { attendees });
      res.json({ message: 'Registered successfully', status: 'confirmed' });
    } else {
      waitlist.push(userId);
      await Event.findByIdAndUpdate(id, { waitlist });
      res.json({ message: 'Added to waitlist', status: 'waitlist' });
    }
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // For Faculty, check ownership
    if (req.user.role === 'Faculty') {
      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (event.created_by.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this event' });
      }
    }
    
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
