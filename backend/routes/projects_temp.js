const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');


// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await Project.find('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Project.find('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { 
      title, description, requirements, team_members, 
      progress, milestone, attachments 
    } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    const created_by = req.user.id;

    const result = await Project.find(
      `INSERT INTO projects (title, description, requirements, team_members, progress, milestone, created_by, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        title, description, 
        JSON.stringify(requirements || []), 
        JSON.stringify(team_members || []), 
        progress || 0, milestone, created_by,
        JSON.stringify(attachments || [])
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, requirements, team_members, 
      progress, milestone, evaluated 
    } = req.body;
    
    // For Faculty, check ownership
    if (req.user.role === 'Faculty') {
      const checkOwner = await Project.find('SELECT created_by FROM projects WHERE id = $1', [id]);
      if (checkOwner.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      if (checkOwner.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to edit this project' });
      }
    }

    const result = await Project.find(
      `UPDATE projects 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           requirements = COALESCE($3, requirements),
           team_members = COALESCE($4, team_members),
           progress = COALESCE($5, progress),
           milestone = COALESCE($6, milestone),
           evaluated = COALESCE($7, evaluated),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [
        title, description, 
        requirements ? JSON.stringify(requirements) : null,
        team_members ? JSON.stringify(team_members) : null,
        progress, milestone, evaluated, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Update project progress
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }

    const result = await Project.find(
      `UPDATE projects SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [progress, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project progress:', error);
    res.status(500).json({ error: 'Failed to update project progress' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, authorizeRoles('HOD', 'DEAN', 'Faculty'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // For Faculty, check ownership
    if (req.user.role === 'Faculty') {
      const checkOwner = await Project.find('SELECT created_by FROM projects WHERE id = $1', [id]);
      if (checkOwner.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      if (checkOwner.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this project' });
      }
    }
    
    const result = await Project.find('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
