import express from 'express';
import pool from './db';
import { authMiddleware, requireRole } from './authMiddleware';

const leadRouter = express.Router();

// GET all leads
leadRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST new lead
leadRouter.post('/', authMiddleware, async (req, res) => {
  const { name, phone, score, budget, project, status, tags, botActive, email, source, advisor_id, currency, budget_amount, notes, interest, birth_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO leads (name, phone, score, budget, project, status, tags, bot_active, email, source, advisor_id, currency, budget_amount, notes, interest, birth_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        name, 
        phone, 
        score || '50%', 
        budget || '', 
        project || '', 
        status || 'Nuevo', 
        JSON.stringify(tags || []), 
        botActive || false,
        email || '',
        source || '',
        advisor_id || null,
        currency || 'USD',
        budget_amount || 0,
        notes || '',
        interest || '',
        birth_date || ''
      ]
    );
    const newLead = result.rows[0];
    const io = req.app.get('io');
    if (io) {
      io.emit('new-lead', {
        id: newLead.id,
        name: newLead.name,
        phone: newLead.phone,
        source: newLead.source || 'Manual',
        interest: newLead.interest || 'Comprar'
      });
    }
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error creating lead', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// PUT update lead
leadRouter.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, phone, score, budget, project, status, tags, botActive, email, source, advisor_id, currency, budget_amount, notes, interest, birth_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE leads 
       SET name=$1, phone=$2, score=$3, budget=$4, project=$5, status=$6, tags=$7, bot_active=$8, 
           email=$9, source=$10, advisor_id=$11, currency=$12, budget_amount=$13, notes=$14, interest=$15, birth_date=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [
        name, 
        phone, 
        score, 
        budget, 
        project, 
        status, 
        JSON.stringify(tags || []), 
        botActive,
        email || '',
        source || '',
        advisor_id || null,
        currency || 'USD',
        budget_amount || 0,
        notes || '',
        interest || '',
        birth_date || '',
        id
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lead', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE lead
leadRouter.delete('/:id', authMiddleware, requireRole('propietario', 'administrador'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM leads WHERE id=$1 RETURNING id, phone', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Lead not found' });
    
    // Eliminar la conversación asociada a este lead
    const phone = result.rows[0].phone;
    if (phone) {
      await pool.query('DELETE FROM evolution_messages WHERE chat_id LIKE $1', [`${phone}%`]);
    }
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting lead', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// PATCH change lead status
leadRouter.patch('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query('UPDATE leads SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [status, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lead status', error);
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// PATCH toggle bot
leadRouter.patch('/:id/bot', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { botActive } = req.body;
  try {
    const result = await pool.query('UPDATE leads SET bot_active=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [botActive, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lead bot', error);
    res.status(500).json({ error: 'Failed to update lead bot' });
  }
});

// POST auto-registro público desde formulario web
leadRouter.post('/public', async (req, res) => {
  const { name, phone, email, interest, comments } = req.body;
  if (!name || !phone || !interest) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: interés, nombre y celular' });
  }

  // Si el interés es 'Vender', NO se guarda en la tabla de leads (es socio/partner)
  if (interest?.toString().toLowerCase() === 'vender') {
    return res.status(200).json({ success: true, savedInLeads: false, message: 'Contacto procesado (Interés Vender: no guardado en leads)' });
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const existRes = await pool.query('SELECT id FROM leads WHERE phone = $1 OR phone = $2', [phone, cleanPhone]);
    let lead;
    if (existRes.rowCount && existRes.rowCount > 0) {
      const updateRes = await pool.query(
        `UPDATE leads SET name = COALESCE(NULLIF($1, ''), name), email = COALESCE(NULLIF($2, ''), email), interest = $3, source = 'Sitio Web', notes = COALESCE(NULLIF($4, ''), notes), updated_at = NOW() WHERE id = $5 RETURNING *`,
        [name, email || '', interest, comments || '', existRes.rows[0].id]
      );
      lead = updateRes.rows[0];
    } else {
      const insertRes = await pool.query(
        `INSERT INTO leads (name, phone, score, status, email, source, notes, interest, tags)
         VALUES ($1, $2, '60%', 'Nuevo', $3, 'Sitio Web', $4, $5, $6) RETURNING *`,
        [name, cleanPhone || phone, email || '', comments || '', interest, JSON.stringify(['Contacto Web'])]
      );
      lead = insertRes.rows[0];
    }
    const io = req.app.get('io');
    if (io) {
      io.emit('new-lead', {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        source: 'Sitio Web',
        interest: lead.interest || 'Comprar'
      });
    }

    res.status(201).json({ success: true, savedInLeads: true, lead });
  } catch (error: any) {
    console.error('Error al registrar lead desde formulario público:', error.message);
    res.status(500).json({ error: 'Error al registrar contacto' });
  }
});

export { leadRouter };


