import pool from './db';

/**
 * Motor de Lead Scoring Inteligente
 * Calcula un score de 0-100 basado en señales reales del comportamiento del lead.
 */

interface ScoreBreakdown {
  responseSpeed: number;      // Velocidad de respuesta
  messageVolume: number;      // Volumen de mensajes
  appointmentActivity: number; // Actividad de citas
  pipelineProgress: number;   // Progreso en pipeline
  budgetMatch: number;        // Match presupuesto vs inventario
  engagement: number;         // Interacción general
  recency: number;            // Actividad reciente
  total: number;
}

/**
 * Calcula el score inteligente de un lead
 */
export async function calculateLeadScore(leadId: number): Promise<{ score: number; breakdown: ScoreBreakdown; trend: 'up' | 'down' | 'stable' }> {
  const client = await pool.connect();
  try {
    // 1. Datos del lead
    const leadRes = await client.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (leadRes.rowCount === 0) return { score: 0, breakdown: emptyBreakdown(), trend: 'stable' };
    const lead = leadRes.rows[0];

    // 2. Mensajes de WhatsApp (velocidad y volumen)
    const phone = lead.phone?.replace(/\D/g, '') || '';
    const messagesRes = await client.query(
      `SELECT from_me, timestamp FROM evolution_messages WHERE chat_id LIKE $1 ORDER BY timestamp ASC`,
      [`%${phone}%`]
    );
    const messages = messagesRes.rows;

    // 3. Tareas y citas
    const tasksRes = await client.query(
      'SELECT type, status, due_date, created_at FROM tasks WHERE lead_id = $1',
      [leadId]
    );
    const tasks = tasksRes.rows;

    // 4. Notas
    const notesRes = await client.query(
      'SELECT COUNT(*) as count FROM notes WHERE lead_id = $1',
      [leadId]
    );
    const noteCount = parseInt(notesRes.rows[0].count);

    // --- CALCULAR CADA SEÑAL ---

    // A) Velocidad de respuesta del lead (máx 15 pts)
    let responseSpeed = 0;
    if (messages.length >= 2) {
      const leadResponses: number[] = [];
      for (let i = 1; i < messages.length; i++) {
        if (!messages[i].from_me && messages[i - 1].from_me) {
          const diff = new Date(messages[i].timestamp).getTime() - new Date(messages[i - 1].timestamp).getTime();
          leadResponses.push(diff / 60000); // minutos
        }
      }
      if (leadResponses.length > 0) {
        const avgMinutes = leadResponses.reduce((a, b) => a + b, 0) / leadResponses.length;
        if (avgMinutes < 5) responseSpeed = 15;
        else if (avgMinutes < 15) responseSpeed = 12;
        else if (avgMinutes < 60) responseSpeed = 8;
        else if (avgMinutes < 360) responseSpeed = 4;
        else responseSpeed = 1;
      }
    }

    // B) Volumen de mensajes (máx 15 pts)
    let messageVolume = 0;
    const leadMessages = messages.filter(m => !m.from_me).length;
    if (leadMessages >= 20) messageVolume = 15;
    else if (leadMessages >= 10) messageVolume = 12;
    else if (leadMessages >= 5) messageVolume = 8;
    else if (leadMessages >= 2) messageVolume = 4;
    else if (leadMessages >= 1) messageVolume = 2;

    // C) Actividad de citas (máx 25 pts)
    let appointmentActivity = 0;
    const citas = tasks.filter(t => t.type === 'cita');
    const citasCompletas = citas.filter(t => t.status === 'completada').length;
    const citasPendientes = citas.filter(t => t.status === 'pendiente').length;
    const citasCanceladas = citas.filter(t => t.status === 'cancelada').length;
    appointmentActivity += Math.min(citasCompletas * 10, 20); // Hasta 20 pts por citas completadas
    appointmentActivity += Math.min(citasPendientes * 3, 6);   // Hasta 6 pts por citas pendientes
    appointmentActivity -= citasCanceladas * 3;                 // Penalización
    appointmentActivity = Math.max(0, Math.min(25, appointmentActivity));

    // D) Progreso en pipeline (máx 20 pts)
    let pipelineProgress = 0;
    const statusWeights: Record<string, number> = {
      'Nuevo': 2,
      'Contactado': 6,
      'Cita': 10,
      'Cita Programada': 10,
      'Negociación': 16,
      'Ganado / Cierre': 20,
      'Cerrado': 20,
    };
    pipelineProgress = statusWeights[lead.status] || 2;

    // E) Match de presupuesto vs inventario (máx 10 pts)
    let budgetMatch = 0;
    if (lead.budget_amount && parseFloat(lead.budget_amount) > 0) {
      const budget = parseFloat(lead.budget_amount);
      const propRes = await client.query(
        `SELECT COUNT(*) as count FROM properties WHERE status = 'Disponible' AND CAST(REPLACE(REPLACE(price, ',', ''), '$', '') AS DECIMAL) BETWEEN $1 AND $2`,
        [budget * 0.7, budget * 1.3]
      );
      const matchCount = parseInt(propRes.rows[0].count);
      if (matchCount > 3) budgetMatch = 10;
      else if (matchCount > 0) budgetMatch = 6;
      else budgetMatch = 2; // Al menos tiene presupuesto definido
    }

    // F) Engagement general (máx 10 pts)
    let engagement = 0;
    if (noteCount > 0) engagement += 2;
    if (lead.email) engagement += 2;
    if (lead.interest) engagement += 2;
    if (lead.tags && lead.tags.length > 0) engagement += 2;
    if (lead.bot_active === false && leadMessages > 0) engagement += 2; // Pidió humano = alto interés
    engagement = Math.min(10, engagement);

    // G) Recency - actividad reciente (máx 5 pts)
    let recency = 0;
    const lastActivity = messages.length > 0 ? new Date(messages[messages.length - 1].timestamp) : new Date(lead.created_at);
    const daysSinceActive = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive < 1) recency = 5;
    else if (daysSinceActive < 3) recency = 4;
    else if (daysSinceActive < 7) recency = 3;
    else if (daysSinceActive < 14) recency = 1;
    else recency = 0;

    const total = Math.min(100, responseSpeed + messageVolume + appointmentActivity + pipelineProgress + budgetMatch + engagement + recency);

    const breakdown: ScoreBreakdown = {
      responseSpeed,
      messageVolume,
      appointmentActivity,
      pipelineProgress,
      budgetMatch,
      engagement,
      recency,
      total,
    };

    // Calcular tendencia (comparar con score almacenado actual)
    const currentScore = parseInt(lead.score) || 50;
    const trend: 'up' | 'down' | 'stable' = total > currentScore + 5 ? 'up' : total < currentScore - 5 ? 'down' : 'stable';

    // Actualizar el score en la DB
    await client.query('UPDATE leads SET score = $1, updated_at = NOW() WHERE id = $2', [`${total}`, leadId]);

    // Guardar historial
    await client.query(
      `INSERT INTO lead_score_history (lead_id, score, breakdown) VALUES ($1, $2, $3)`,
      [leadId, total, JSON.stringify(breakdown)]
    );

    return { score: total, breakdown, trend };
  } catch (err) {
    console.error('[Scoring] Error calculando score:', err);
    return { score: 50, breakdown: emptyBreakdown(), trend: 'stable' };
  } finally {
    client.release();
  }
}

/**
 * Recalcula scores de TODOS los leads
 */
export async function recalculateAllScores(): Promise<{ updated: number }> {
  try {
    const result = await pool.query('SELECT id FROM leads ORDER BY id');
    let updated = 0;
    for (const row of result.rows) {
      await calculateLeadScore(row.id);
      updated++;
    }
    console.log(`[Scoring] ${updated} leads recalculados`);
    return { updated };
  } catch (err) {
    console.error('[Scoring] Error en recálculo masivo:', err);
    return { updated: 0 };
  }
}

/**
 * Genera insights analíticos para el dashboard
 */
export async function getAnalyticsInsights() {
  const client = await pool.connect();
  try {
    // 1. Embudo de conversión
    const funnelRes = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status 
      ORDER BY CASE status
        WHEN 'Nuevo' THEN 1 WHEN 'Contactado' THEN 2 WHEN 'Cita' THEN 3 
        WHEN 'Cita Programada' THEN 3 WHEN 'Negociación' THEN 4 
        WHEN 'Ganado / Cierre' THEN 5 WHEN 'Cerrado' THEN 5 WHEN 'Perdido' THEN 6 
        ELSE 7 END
    `);

    // 2. Distribución de scores
    const scoreDistRes = await client.query(`
      SELECT 
        CASE 
          WHEN CAST(REPLACE(score,'%','') AS INTEGER) >= 80 THEN 'hot'
          WHEN CAST(REPLACE(score,'%','') AS INTEGER) >= 50 THEN 'warm'
          WHEN CAST(REPLACE(score,'%','') AS INTEGER) >= 20 THEN 'cold'
          ELSE 'dead'
        END as category,
        COUNT(*) as count
      FROM leads
      WHERE score IS NOT NULL AND score != ''
      GROUP BY category
    `);

    // 3. Tasa de conversión por fuente
    const sourceConvRes = await client.query(`
      SELECT 
        COALESCE(source, 'Directo') as source,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('Cerrado', 'Ganado / Cierre')) as closed
      FROM leads 
      WHERE source IS NOT NULL AND source != ''
      GROUP BY source
      ORDER BY total DESC
      LIMIT 10
    `);

    // 4. Velocidad del pipeline (días promedio por etapa)
    const velocityRes = await client.query(`
      SELECT 
        status, 
        AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::int as avg_days
      FROM leads 
      GROUP BY status
    `);

    // 5. Actividad por hora del día (cuándo responden los leads)
    const hourlyRes = await client.query(`
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as count
      FROM evolution_messages 
      WHERE from_me = false
      GROUP BY hour
      ORDER BY hour
    `);

    // 6. Leads que necesitan atención (sin contacto reciente)
    const coldLeadsRes = await client.query(`
      SELECT l.id, l.name, l.phone, l.status, l.score, l.updated_at,
        (SELECT MAX(timestamp) FROM evolution_messages WHERE chat_id LIKE '%' || REPLACE(l.phone, '+', '') || '%') as last_message
      FROM leads l
      WHERE l.status NOT IN ('Cerrado', 'Ganado / Cierre', 'Perdido')
      ORDER BY l.updated_at ASC
      LIMIT 10
    `);

    // 7. Rendimiento por asesor
    const advisorRes = await client.query(`
      SELECT 
        u.name as advisor_name,
        COUNT(l.id) as total_leads,
        COUNT(l.id) FILTER (WHERE l.status IN ('Cerrado', 'Ganado / Cierre')) as closed,
        AVG(CAST(REPLACE(l.score,'%','') AS INTEGER)) as avg_score
      FROM leads l
      JOIN users u ON l.advisor_id = u.id
      GROUP BY u.name
      ORDER BY closed DESC
    `);

    // 8. Proyección de cierres (leads calientes con citas próximas)
    const projectionRes = await client.query(`
      SELECT COUNT(*) as hot_leads
      FROM leads 
      WHERE CAST(REPLACE(score,'%','') AS INTEGER) >= 70
      AND status NOT IN ('Cerrado', 'Ganado / Cierre', 'Perdido')
    `);

    // 9. Tareas pendientes por tipo
    const taskStatsRes = await client.query(`
      SELECT 
        type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completada') as done,
        COUNT(*) FILTER (WHERE status = 'pendiente') as pending
      FROM tasks
      GROUP BY type
    `);

    // 10. KPIs generales
    const totalLeads = await client.query('SELECT COUNT(*) as count FROM leads');
    const closedLeads = await client.query("SELECT COUNT(*) as count FROM leads WHERE status IN ('Cerrado', 'Ganado / Cierre')");
    const newThisWeek = await client.query("SELECT COUNT(*) as count FROM leads WHERE created_at >= NOW() - INTERVAL '7 days'");
    const avgScore = await client.query("SELECT COALESCE(AVG(CAST(REPLACE(score,'%','') AS INTEGER)), 0) as avg FROM leads WHERE score IS NOT NULL AND score != ''");

    return {
      funnel: funnelRes.rows,
      scoreDistribution: scoreDistRes.rows,
      sourceConversion: sourceConvRes.rows,
      pipelineVelocity: velocityRes.rows,
      hourlyActivity: hourlyRes.rows,
      coldLeads: coldLeadsRes.rows,
      advisorPerformance: advisorRes.rows,
      projectedClosings: parseInt(projectionRes.rows[0]?.hot_leads || '0'),
      taskStats: taskStatsRes.rows,
      kpis: {
        totalLeads: parseInt(totalLeads.rows[0].count),
        closedLeads: parseInt(closedLeads.rows[0].count),
        conversionRate: parseInt(totalLeads.rows[0].count) > 0 
          ? ((parseInt(closedLeads.rows[0].count) / parseInt(totalLeads.rows[0].count)) * 100).toFixed(1) 
          : '0',
        newThisWeek: parseInt(newThisWeek.rows[0].count),
        avgScore: parseInt(avgScore.rows[0].avg) || 0,
      }
    };
  } catch (err) {
    console.error('[Analytics] Error generando insights:', err);
    return { funnel: [], scoreDistribution: [], sourceConversion: [], pipelineVelocity: [], hourlyActivity: [], coldLeads: [], advisorPerformance: [], projectedClosings: 0, taskStats: [], kpis: { totalLeads: 0, closedLeads: 0, conversionRate: '0', newThisWeek: 0, avgScore: 0 } };
  } finally {
    client.release();
  }
}

/**
 * Obtiene leads que necesitan seguimiento urgente
 */
export async function getFollowUpQueue() {
  const client = await pool.connect();
  try {
    // Leads sin contacto en 48h+ que no están cerrados
    const urgentRes = await client.query(`
      SELECT l.id, l.name, l.phone, l.status, l.score, l.advisor_id, l.updated_at,
        u.name as advisor_name,
        (SELECT MAX(timestamp) FROM evolution_messages WHERE chat_id LIKE '%' || REPLACE(l.phone, '+', '') || '%') as last_message,
        (SELECT COUNT(*) FROM tasks WHERE lead_id = l.id AND status = 'pendiente') as pending_tasks
      FROM leads l
      LEFT JOIN users u ON l.advisor_id = u.id
      WHERE l.status NOT IN ('Cerrado', 'Ganado / Cierre', 'Perdido')
      ORDER BY l.updated_at ASC
    `);

    const now = Date.now();
    const urgent: any[] = [];
    const today: any[] = [];
    const thisWeek: any[] = [];

    for (const lead of urgentRes.rows) {
      const lastContact = lead.last_message ? new Date(lead.last_message).getTime() : new Date(lead.updated_at).getTime();
      const hoursSince = (now - lastContact) / (1000 * 60 * 60);
      const daysSince = hoursSince / 24;

      const item = {
        ...lead,
        hoursSinceContact: Math.round(hoursSince),
        daysSinceContact: Math.round(daysSince * 10) / 10,
        reason: '',
        priority: 'low' as 'urgent' | 'today' | 'week' | 'low',
      };

      if (hoursSince > 48 && parseInt(lead.score) >= 50) {
        item.reason = `Sin contacto hace ${Math.round(daysSince)} días - Score alto (${lead.score}%)`;
        item.priority = 'urgent';
        urgent.push(item);
      } else if (hoursSince > 24) {
        item.reason = `Último contacto hace ${Math.round(hoursSince)}h`;
        item.priority = 'today';
        today.push(item);
      } else if (parseInt(lead.pending_tasks) > 0) {
        item.reason = `${lead.pending_tasks} tareas pendientes`;
        item.priority = 'week';
        thisWeek.push(item);
      } else if (lead.status === 'Nuevo') {
        item.reason = 'Lead nuevo sin gestionar';
        item.priority = 'today';
        today.push(item);
      }
    }

    return { urgent, today, thisWeek, totalLeads: urgentRes.rowCount };
  } catch (err) {
    console.error('[FollowUp] Error:', err);
    return { urgent: [], today: [], thisWeek: [], totalLeads: 0 };
  } finally {
    client.release();
  }
}

function emptyBreakdown(): ScoreBreakdown {
  return { responseSpeed: 0, messageVolume: 0, appointmentActivity: 0, pipelineProgress: 0, budgetMatch: 0, engagement: 0, recency: 0, total: 0 };
}
