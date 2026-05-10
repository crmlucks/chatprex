import express from 'express';
import pool from './db';
import { authMiddleware } from './authMiddleware';
import { sendEvolutionMessage } from './evolution';

const campaignRouter = express.Router();

// GET all campaigns
campaignRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM campaigns ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching campaigns', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST create campaign
campaignRouter.post('/', authMiddleware, async (req, res) => {
  const { name, type, message, use_ai, recipient_source, db_filter, manual_recipients, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO campaigns (name, type, message, use_ai, recipient_source, db_filter, manual_recipients, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, type, message, use_ai || false, recipient_source || 'database', db_filter || 'todos', manual_recipients || '', status || 'Borrador']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating campaign', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT update campaign
campaignRouter.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, type, message, use_ai, recipient_source, db_filter, manual_recipients, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE campaigns 
       SET name=$1, type=$2, message=$3, use_ai=$4, recipient_source=$5, db_filter=$6, manual_recipients=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name, type, message, use_ai, recipient_source, db_filter, manual_recipients, status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating campaign', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE campaign
campaignRouter.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM campaigns WHERE id=$1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting campaign', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// POST start campaign
campaignRouter.post('/:id/start', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get campaign
    const campRes = await pool.query('SELECT * FROM campaigns WHERE id=$1', [id]);
    if (campRes.rowCount === 0) return res.status(404).json({ error: 'Campaign not found' });
    const campaign = campRes.rows[0];

    // 2. Set to 'Activo'
    await pool.query("UPDATE campaigns SET status='Activo', progress=0 WHERE id=$1", [id]);

    // 3. Get leads based on filter
    let phones: string[] = [];
    if (campaign.recipient_source === 'database') {
      let query = 'SELECT phone, name FROM leads WHERE phone IS NOT NULL AND phone != \'\'';
      if (campaign.db_filter !== 'todos') {
        query += ` AND status = '${campaign.db_filter}'`; // Simplify for now
      }
      const leadsRes = await pool.query(query);
      
      // Async message sending in background
      (async () => {
        let total = leadsRes.rows.length;
        if(total === 0) {
            await pool.query("UPDATE campaigns SET status='Completado', progress=100 WHERE id=$1", [id]);
            return;
        }
        let sent = 0;
        for (const lead of leadsRes.rows) {
          try {
            // Reemplazar variables básicas
            const personalizedMsg = campaign.message.replace(/{{nombre}}/g, lead.name || 'Cliente');
            await sendEvolutionMessage(lead.phone, personalizedMsg);
          } catch(e) {
            console.error('Error sending campaign message to', lead.phone, e);
          }
          sent++;
          const progress = Math.round((sent / total) * 100);
          await pool.query('UPDATE campaigns SET progress=$1 WHERE id=$2', [progress, id]);
          // Retraso aleatorio de 7 a 15 segundos para evitar spam (bloqueo por WhatsApp)
          await new Promise(r => setTimeout(r, 7000 + Math.random() * 8000));
        }
        await pool.query("UPDATE campaigns SET status='Completado', progress=100 WHERE id=$1", [id]);
      })();

    } else if (campaign.recipient_source === 'manual') {
      // Manual list separated by comma
      const manualList = campaign.manual_recipients.split(',').map((p: string) => p.trim()).filter(Boolean);
      let total = manualList.length;
      
      (async () => {
        if(total === 0) {
            await pool.query("UPDATE campaigns SET status='Completado', progress=100 WHERE id=$1", [id]);
            return;
        }
        let sent = 0;
        for (const phone of manualList) {
          try {
            const personalizedMsg = campaign.message.replace(/{{nombre}}/g, 'Cliente');
            await sendEvolutionMessage(phone, personalizedMsg);
          } catch(e) {
            console.error('Error sending campaign message to', phone, e);
          }
          sent++;
          const progress = Math.round((sent / total) * 100);
          await pool.query('UPDATE campaigns SET progress=$1 WHERE id=$2', [progress, id]);
          await new Promise(r => setTimeout(r, 7000 + Math.random() * 8000));
        }
        await pool.query("UPDATE campaigns SET status='Completado', progress=100 WHERE id=$1", [id]);
      })();
    }

    res.json({ success: true, message: 'Campaña iniciada' });
  } catch (error) {
    console.error('Error starting campaign', error);
    res.status(500).json({ error: 'Failed to start campaign' });
  }
});

export { campaignRouter };
