import express from 'express';
import pool from './db';

const integrationRoutes = express.Router();

// Obtener configuración de integraciones
integrationRoutes.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, provider, api_key, enabled, config FROM integrations ORDER BY provider ASC');
    
    // Ocultar las claves API
    const safeIntegrations = result.rows.map(int => {
      let safeApiKey = int.api_key;
      if (safeApiKey && safeApiKey.length > 10) {
        safeApiKey = safeApiKey.substring(0, 4) + '...' + safeApiKey.substring(safeApiKey.length - 4);
      }
      return {
        ...int,
        hasApiKey: !!int.api_key,
        api_key: safeApiKey
      };
    });

    res.json(safeIntegrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Guardar/Actualizar configuración de integración
integrationRoutes.post('/', async (req, res) => {
  const { provider, api_key, enabled, config } = req.body;
  try {
    let apiKeyToSave = api_key;
    
    if (api_key === 'UNCHANGED') {
      const check = await pool.query('SELECT api_key FROM integrations WHERE provider = $1', [provider]);
      if (check.rowCount > 0) apiKeyToSave = check.rows[0].api_key;
    }

    await pool.query(
      `INSERT INTO integrations (provider, api_key, enabled, config, updated_at) 
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (provider) DO UPDATE 
       SET api_key = EXCLUDED.api_key, enabled = EXCLUDED.enabled, config = EXCLUDED.config, updated_at = NOW()`,
      [provider, apiKeyToSave || '', enabled || false, config || {}]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

export default integrationRoutes;
