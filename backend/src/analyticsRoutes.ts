import express from 'express';
import { authMiddleware } from './authMiddleware';
import { calculateLeadScore, recalculateAllScores, getAnalyticsInsights, getFollowUpQueue } from './scoring';

const analyticsRouter = express.Router();

// Todas las rutas requieren autenticación
analyticsRouter.use(authMiddleware);

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
