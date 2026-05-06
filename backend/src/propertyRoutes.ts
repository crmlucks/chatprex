import express from 'express';
import pool from './db';
import { authMiddleware } from './authMiddleware';

const propertyRouter = express.Router();

// GET all properties
propertyRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching properties', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// POST new property
propertyRouter.post('/', authMiddleware, async (req, res) => {
  const { type, name, project, developer, price, currency, location, area, rooms, details, status, image } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO properties (type, name, project, developer, price, currency, location, area, rooms, details, status, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [type, name, project || '', developer || '', price, currency || 'USD', location, area || '', rooms || '', details || '', status || 'Disponible', image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating property', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// PUT update property
propertyRouter.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { type, name, project, developer, price, currency, location, area, rooms, details, status, image } = req.body;
  try {
    const result = await pool.query(
      `UPDATE properties 
       SET type=$1, name=$2, project=$3, developer=$4, price=$5, currency=$6, location=$7, area=$8, rooms=$9, details=$10, status=$11, image=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [type, name, project, developer, price, currency, location, area, rooms, details, status, image, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Property not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating property', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// DELETE property
propertyRouter.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM properties WHERE id=$1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Property not found' });
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting property', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

export { propertyRouter };
