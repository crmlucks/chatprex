import express from 'express';
import { authMiddleware } from './authMiddleware';
import { calculateLeadScore, recalculateAllScores, getAnalyticsInsights, getFollowUpQueue } from './scoring';

const analyticsRouter = express.Router();
import pool from './db';

// --- RUTAS PÚBLICAS ---
/**
 * POST /api/analytics/view - Registrar visita de página o propiedad
 */
analyticsRouter.post('/view', async (req, res) => {
  const { path, property_id } = req.body;
  if (!path) return res.status(400).json({ error: 'Path is required' });
  try {
    await pool.query(
      'INSERT INTO page_views (path, property_id) VALUES ($1, $2)',
      [path, property_id || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Analytics] Error logging view:', err);
    res.status(500).json({ error: 'Error recording view' });
  }
});

// --- RUTAS PROTEGIDAS ---
// Todas las rutas siguientes requieren autenticación
analyticsRouter.use(authMiddleware);

/**
 * GET /api/analytics/visits - Obtener estadisticas de visitas
 */
analyticsRouter.get('/visits', async (req, res) => {
  try {
    const { range } = req.query; // 'hoy', 'mes', 'todo'
    
    let dateFilter = '';
    if (range === 'hoy') {
      dateFilter = `WHERE created_at >= NOW() - INTERVAL '1 day'`;
    } else if (range === 'mes') {
      dateFilter = `WHERE created_at >= NOW() - INTERVAL '30 days'`;
    }

    const totalRes = await pool.query(`SELECT COUNT(*) as total FROM page_views ${dateFilter}`);
    
    // Top propiedades
    const topPropsRes = await pool.query(`
      SELECT property_id, COUNT(*) as views 
      FROM page_views 
      ${dateFilter ? dateFilter + ' AND property_id IS NOT NULL' : 'WHERE property_id IS NOT NULL'} 
      GROUP BY property_id 
      ORDER BY views DESC 
      LIMIT 5
    `);

    res.json({
      total: parseInt(totalRes.rows[0].total),
      topProperties: topPropsRes.rows
    });
  } catch (err) {
    console.error('[Analytics] Error fetching visits:', err);
    res.status(500).json({ error: 'Error fetching visits stats' });
  }
});

/**
 * GET /api/analytics/insights - Dashboard completo de inteligencia
 */
analyticsRouter.get('/insights', async (req, res) => {
  try {
    const insights = await getAnalyticsInsights();
    res.json(insights);
  } catch (err) {
    console.error('[Analytics] Error:', err);
    res.status(500).json({ error: 'Error generando insights' });
  }
});

/**
 * GET /api/analytics/follow-up - Cola de seguimiento priorizad
 */
analyticsRouter.get('/follow-up', async (req, res) => {
  try {
    const queue = await getFollowUpQueue();
    res.json(queue);
  } catch (err) {
    console.error('[Analytics] Error follow-up:', err);
    res.status(500).json({ error: 'Error generando cola de seguimiento' });
  }
});

/**
 * POST /api/analytics/score/:id - Recalcular score de un lead
 */
analyticsRouter.post('/score/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await calculateLeadScore(parseInt(id));
    res.json(result);
  } catch (err) {
    console.error('[Analytics] Error scoring:', err);
    res.status(500).json({ error: 'Error calculando score' });
  }
});

/**
 * POST /api/analytics/recalculate-all - Recalcular todos los scores
 */
analyticsRouter.post('/recalculate-all', async (req, res) => {
  try {
    const result = await recalculateAllScores();
    res.json(result);
  } catch (err) {
    console.error('[Analytics] Error recalculating:', err);
    res.status(500).json({ error: 'Error recalculando scores' });
  }
});

/**
 * GET /api/analytics/score-history/:id - Historial de scores de un lead
 */
analyticsRouter.get('/score-history/:id', async (req, res) => {
  try {
    const { default: pool } = await import('./db');
    const result = await pool.query(
      'SELECT score, breakdown, created_at FROM lead_score_history WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 30',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Analytics] Error history:', err);
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
});

export { analyticsRouter };
