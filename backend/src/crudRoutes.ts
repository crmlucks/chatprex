import express from 'express';
import pool from './db';

const router = express.Router();

// --- TASKS ---
router.get('/tasks', async (req, res) => {
  try {
    const { lead_id, type } = req.query;
    let query = 'SELECT * FROM tasks WHERE 1=1';
    let params: any[] = [];
    if (lead_id) { params.push(lead_id); query += ` AND lead_id = $${params.length}`; }
    if (type) { params.push(type); query += ` AND type = $${params.length}`; }
    query += ' ORDER BY due_date ASC, id DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/tasks', async (req, res) => {
  const { title, description, type, status, due_date, lead_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, type, status, due_date, lead_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, type || 'tarea', status || 'pendiente', due_date, lead_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  const { title, description, status, due_date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title=$1, description=$2, status=$3, due_date=$4 WHERE id=$5 RETURNING *',
      [title, description, status, due_date, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- NOTES ---
router.get('/notes', async (req, res) => {
  try {
    const { lead_id } = req.query;
    let query = 'SELECT * FROM notes';
    let params: any[] = [];
    if (lead_id) { params.push(lead_id); query += ` WHERE lead_id = $${params.length}`; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/notes', async (req, res) => {
  const { lead_id, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO notes (lead_id, content) VALUES ($1, $2) RETURNING *',
      [lead_id, content]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/notes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- FINANCES: CLIENTS ---
router.get('/finances/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM finances_clients ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// --- FINANCES: TRANSACTIONS ---
router.get('/finances/transactions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.name as client_name 
      FROM transactions t 
      LEFT JOIN finances_clients c ON t.client_id = c.id 
      ORDER BY t.date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});
// --- ADMIN: PROJECTS ---
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.post('/projects', async (req, res) => {
  const { name, code, status } = req.body;
  try {
    const result = await pool.query('INSERT INTO projects (name, code, status) VALUES ($1, $2, $3) RETURNING *', [name, code, status || 'Activo']);
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.put('/projects/:id', async (req, res) => {
  const { name, code, status } = req.body;
  try {
    const result = await pool.query('UPDATE projects SET name=$1, code=$2, status=$3 WHERE id=$4 RETURNING *', [name, code, status, req.params.id]);
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.delete('/projects/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

// --- ADMIN: PIPELINE STAGES ---
router.get('/pipeline', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pipeline_stages ORDER BY "order" ASC, id ASC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.post('/pipeline', async (req, res) => {
  const { name, color, visible } = req.body;
  try {
    const result = await pool.query('INSERT INTO pipeline_stages (name, color, visible) VALUES ($1, $2, $3) RETURNING *', [name, color, visible]);
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.put('/pipeline/:id', async (req, res) => {
  const { name, color, visible } = req.body;
  try {
    const result = await pool.query('UPDATE pipeline_stages SET name=$1, color=$2, visible=$3 WHERE id=$4 RETURNING *', [name, color, visible, req.params.id]);
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.delete('/pipeline/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pipeline_stages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

// --- ADMIN: SOURCES ---
router.get('/sources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lead_sources ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.post('/sources', async (req, res) => {
  const { name, icon, visible } = req.body;
  try {
    const result = await pool.query('INSERT INTO lead_sources (name, icon, visible) VALUES ($1, $2, $3) RETURNING *', [name, icon, visible]);
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.put('/sources/:id', async (req, res) => {
  const { name, icon, visible } = req.body;
  try {
    const result = await pool.query('UPDATE lead_sources SET name=$1, icon=$2, visible=$3 WHERE id=$4 RETURNING *', [name, icon, visible, req.params.id]);
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.delete('/sources/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM lead_sources WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
export default router;
