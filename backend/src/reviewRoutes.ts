import express from 'express';
import { Pool } from 'pg';
import { authMiddleware } from './authMiddleware';

const router = express.Router();
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'casaya',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }
);

// Middleware opcional para identificar si el usuario está autenticado sin bloquear si no lo está
const optionalAuthMiddleware = (req: any, res: any, next: any) => {
  authMiddleware(req, res, () => next());
};

// POST: Crear una nueva reseña (pública, pasa a pendiente)
router.post('/', async (req, res) => {
  const { property_id, author_name, rating, comment } = req.body;
  if (!author_name || !rating) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO reviews (property_id, author_name, rating, comment, status) 
       VALUES ($1, $2, $3, $4, 'pendiente') RETURNING *`,
      [property_id || null, author_name, rating, comment || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando reseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET: Listar reseñas (Público: solo aprobadas. Admin: todas)
router.get('/', async (req: any, res) => {
  const { property_id, all } = req.query;
  const token = req.headers.authorization?.split(' ')[1];
  
  let isAdmin = false;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      if (decoded.role === 'administrador' || decoded.role === 'propietario') {
        isAdmin = true;
      }
    } catch(e) {}
  }

  try {
    let query = 'SELECT * FROM reviews WHERE 1=1';
    let params: any[] = [];
    
    if (!isAdmin || all !== 'true') {
      query += ` AND status = 'aprobada'`;
    }
    
    if (property_id) {
      params.push(property_id);
      query += ` AND property_id = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// PUT: Actualizar estado de una reseña (Solo Admin)
router.put('/:id', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'administrador' && req.user.role !== 'propietario') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  const { id } = req.params;
  const { status } = req.body;
  if (!['pendiente', 'aprobada', 'rechazada'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    const result = await pool.query(
      'UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando reseña' });
  }
});

// DELETE: Eliminar una reseña (Solo Admin)
router.delete('/:id', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'administrador' && req.user.role !== 'propietario') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json({ message: 'Reseña eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando reseña' });
  }
});

export default router;
