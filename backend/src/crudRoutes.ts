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

router.post('/finances/clients', async (req, res) => {
  const { 
    name, email, phone, doc, civilStatus, spouseDoc, spouseName, spousePhone, 
    address, district, province, department, notes, property, agent 
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO finances_clients (
        name, email, phone, doc, civil_status, spouse_doc, spouse_name, spouse_phone, 
        address, district, province, department, notes, property_id, agent_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        name, email, phone, doc, civilStatus, spouseDoc, spouseName, spousePhone, 
        address, district, province, department, notes, 
        property ? parseInt(property) : null, 
        agent ? parseInt(agent) : null
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/finances/clients/:id', async (req, res) => {
  const { 
    name, email, phone, doc, civilStatus, spouseDoc, spouseName, spousePhone, 
    address, district, province, department, notes, property, agent 
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE finances_clients SET 
        name=$1, email=$2, phone=$3, doc=$4, civil_status=$5, spouse_doc=$6, spouse_name=$7, spouse_phone=$8, 
        address=$9, district=$10, province=$11, department=$12, notes=$13, property_id=$14, agent_id=$15
      WHERE id=$16 RETURNING *`,
      [
        name, email, phone, doc, civilStatus, spouseDoc, spouseName, spousePhone, 
        address, district, province, department, notes, 
        property ? parseInt(property) : null, 
        agent ? parseInt(agent) : null,
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/finances/clients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM finances_clients WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
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

router.post('/finances/transactions', async (req, res) => {
  const { client, concept, type, amount, currency, date, property } = req.body;
  try {
    // Try to find client_id by name
    let clientId = null;
    if (client) {
      const clientRes = await pool.query('SELECT id FROM finances_clients WHERE name ILIKE $1 LIMIT 1', [client]);
      if (clientRes.rows.length > 0) clientId = clientRes.rows[0].id;
    }
    const result = await pool.query(
      `INSERT INTO transactions (client_id, type, amount, description, concept, currency, date, property_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [clientId, type, amount, concept, concept, currency || 'local', date || new Date(), property ? parseInt(property) : null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/finances/transactions/:id', async (req, res) => {
  const { type, amount, concept, currency, date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE transactions SET type=$1, amount=$2, description=$3, concept=$4, currency=$5, date=$6 WHERE id=$7 RETURNING *',
      [type, amount, concept, concept, currency, date, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/finances/transactions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
// --- ADMIN: PROJECTS ---
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
router.post('/projects', async (req, res) => {
  const { name, developer, contact, phone, email, address, currency, status, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, developer, contact, phone, email, address, currency, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', 
      [name, developer, contact, phone, email, address, currency || 'PEN', status || 'Activo', notes]
    );
    res.json(result.rows[0]);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Database error' }); 
  }
});
router.put('/projects/:id', async (req, res) => {
  const { name, developer, contact, phone, email, address, currency, status, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE projects SET name=$1, developer=$2, contact=$3, phone=$4, email=$5, address=$6, currency=$7, status=$8, notes=$9 WHERE id=$10 RETURNING *', 
      [name, developer, contact, phone, email, address, currency, status, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Database error' }); 
  }
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
