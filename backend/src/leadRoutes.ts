import express from 'express';
import pool from './db';
import { authMiddleware } from './authMiddleware';

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
  const { name, phone, score, budget, project, status, tags, botActive } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO leads (name, phone, score, budget, project, status, tags, bot_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        name, 
        phone, 
        score || '50%', 
        budget || '', 
        project || '', 
        status || 'Nuevo', 
        JSON.stringify(tags || []), 
        botActive || false
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating lead', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// PUT update lead
leadRouter.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, phone, score, budget, project, status, tags, botActive } = req.body;
  try {
    const result = await pool.query(
      `UPDATE leads 
       SET name=$1, phone=$2, score=$3, budget=$4, project=$5, status=$6, tags=$7, bot_active=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [
        name, 
        phone, 
        score, 
        budget, 
        project, 
        status, 
        JSON.stringify(tags || []), 
        botActive, 
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
leadRouter.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM leads WHERE id=$1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Lead not found' });
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

export { leadRouter };
