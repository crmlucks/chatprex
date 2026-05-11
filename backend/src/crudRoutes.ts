import express from 'express';
import pool from './db';
import { authMiddleware, requireRole } from './authMiddleware';

const router = express.Router();

router.use(authMiddleware);

// --- TASKS ---
router.get('/tasks', async (req, res) => {
  try {
    const { lead_id, type } = req.query;
    let query = 'SELECT t.*, l.name as lead_name FROM tasks t LEFT JOIN leads l ON t.lead_id = l.id WHERE 1=1';
    let params: any[] = [];
    if (lead_id) { params.push(lead_id); query += ` AND t.lead_id = $${params.length}`; }
    if (type) { params.push(type); query += ` AND t.type = $${params.length}`; }
    query += ' ORDER BY t.due_date ASC, t.id DESC';
    
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
  const { title, description, type, status, due_date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title=$1, description=$2, status=$3, due_date=$4, type=COALESCE($5, type) WHERE id=$6 RETURNING *',
      [title, description, status, due_date, type || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/tasks/:id', requireRole('propietario', 'administrador'), async (req, res) => {
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

router.delete('/notes/:id', requireRole('propietario', 'administrador'), async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- LEAD HISTORY (unified timeline) ---
router.get('/history/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    
    // Get lead phone for message lookup
    const leadRes = await pool.query('SELECT phone FROM leads WHERE id = $1', [leadId]);
    const phone = leadRes.rows[0]?.phone || '';
    
    // 1. Tasks
    const tasksRes = await pool.query(
      'SELECT id, title, description, type, status, due_date, created_at FROM tasks WHERE lead_id = $1 ORDER BY created_at DESC',
      [leadId]
    );
    
    // 2. Notes
    const notesRes = await pool.query(
      'SELECT id, content, created_at FROM notes WHERE lead_id = $1 ORDER BY created_at DESC',
      [leadId]
    );
    
    // 3. WhatsApp messages (last 50)
    let messages: any[] = [];
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const msgRes = await pool.query(
        `SELECT id, text, from_me, timestamp FROM evolution_messages 
         WHERE chat_id LIKE $1 
         ORDER BY timestamp DESC LIMIT 50`,
        [`${cleanPhone}%`]
      );
      messages = msgRes.rows;
    }
    
    // Build unified timeline
    const timeline: any[] = [];
    
    for (const t of tasksRes.rows) {
      timeline.push({
        id: `task-${t.id}`,
        category: 'task',
        icon: t.type === 'cita' ? 'calendar' : 'task',
        title: t.type === 'cita' ? `Cita: ${t.title}` : `Tarea: ${t.title}`,
        description: t.description || '',
        status: t.status,
        timestamp: t.created_at,
        due_date: t.due_date
      });
    }
    
    for (const n of notesRes.rows) {
      timeline.push({
        id: `note-${n.id}`,
        category: 'note',
        icon: 'note',
        title: 'Nota agregada',
        description: n.content,
        timestamp: n.created_at
      });
    }
    
    for (const m of messages) {
      timeline.push({
        id: `msg-${m.id}`,
        category: 'message',
        icon: m.from_me ? 'sent' : 'received',
        title: m.from_me ? 'Mensaje enviado' : 'Mensaje recibido',
        description: (m.text || '').substring(0, 120),
        timestamp: m.timestamp
      });
    }
    
    // Sort by timestamp descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(timeline.slice(0, 100));
  } catch (error) {
    console.error('Error fetching history', error);
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

router.delete('/finances/clients/:id', requireRole('propietario', 'administrador'), async (req, res) => {
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

router.delete('/finances/transactions/:id', requireRole('propietario', 'administrador'), async (req, res) => {
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
router.delete('/projects/:id', requireRole('propietario', 'administrador'), async (req, res) => {
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
router.delete('/pipeline/:id', requireRole('propietario', 'administrador'), async (req, res) => {
  try {
    await pool.query('DELETE FROM pipeline_stages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});

router.put('/pipeline/reorder', async (req, res) => {
  const { stages } = req.body; // Array of {id, order}
  try {
    const queries = stages.map((s: any) => pool.query('UPDATE pipeline_stages SET "order"=$1 WHERE id=$2', [s.order, s.id]));
    await Promise.all(queries);
    res.json({ success: true });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Database error' }); 
  }
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
router.delete('/sources/:id', requireRole('propietario', 'administrador'), async (req, res) => {
  try {
    await pool.query('DELETE FROM lead_sources WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Database error' }); }
});
export default router;
