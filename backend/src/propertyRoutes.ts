import express from 'express';
import pool from './db';
import { authMiddleware, requireRole } from './authMiddleware';

const propertyRouter = express.Router();

// GET public properties (no auth required)
propertyRouter.get('/public', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             pr.price_from as proj_price_from, pr.price_to as proj_price_to, 
             pr.area_from as proj_area_from, pr.area_to as proj_area_to 
      FROM properties p 
      LEFT JOIN projects pr ON p.project = pr.name
      WHERE p.visible = true 
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching public properties', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

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
  const { type, name, project, developer, price, currency, location, area, rooms, bathrooms, parking, floor, notes, details, status, image, avatar, images, featured, visible } = req.body;
  try {
    const propertyDetails = notes || details || '';
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : '[]';
    const result = await pool.query(
      `INSERT INTO properties (type, name, project, developer, price, currency, location, area, rooms, bathrooms, parking, floor, details, status, image, avatar, images, featured, visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [type, name, project || '', developer || '', price, currency || 'USD', location, area || '', rooms || '', bathrooms || '', parking || '', floor || '', propertyDetails, status || 'Disponible', image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80', avatar || '', imagesJson, featured ?? false, visible ?? true]
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
  const { type, name, project, developer, price, currency, location, area, rooms, bathrooms, parking, floor, notes, details, status, image, avatar, images, featured, visible } = req.body;
  try {
    const propertyDetails = notes || details || '';
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : '[]';
    const result = await pool.query(
      `UPDATE properties 
       SET type=$1, name=$2, project=$3, developer=$4, price=$5, currency=$6, location=$7, area=$8, rooms=$9, bathrooms=$10, parking=$11, floor=$12, details=$13, status=$14, image=$15, avatar=$16, images=$17, featured=$18, visible=$19, updated_at=NOW()
       WHERE id=$20 RETURNING *`,
      [type, name, project, developer, price, currency, location, area, rooms, bathrooms, parking, floor, propertyDetails, status, image, avatar, imagesJson, featured ?? false, visible ?? true, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Property not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating property', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// DELETE property
propertyRouter.delete('/:id', authMiddleware, requireRole('propietario', 'administrador'), async (req, res) => {
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
