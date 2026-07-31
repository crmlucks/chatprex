import express from 'express';
import pool from './db';
import fetch from 'node-fetch';

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

// Probar conexión a HubSpot
integrationRoutes.post('/test-hubspot', async (req, res) => {
  const { api_key } = req.body;
  try {
    let tokenToUse = api_key;
    if (api_key === 'UNCHANGED') {
      const check = await pool.query("SELECT api_key FROM integrations WHERE provider = 'hubspot'");
      if (check.rowCount > 0) tokenToUse = check.rows[0].api_key;
    }
    
    if (!tokenToUse) return res.status(400).json({ success: false, error: 'No hay token' });
    
    const cleanToken = tokenToUse.trim();
    
    // Test creating a dummy contact
    const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify({
        properties: {
          firstname: 'Test de Conexión Chatprex',
          phone: '+51999888777'
        }
      })
    });
    
    if (!createRes.ok) {
      const err = await createRes.json();
      return res.json({ success: false, error: err.message || JSON.stringify(err) });
    }
    
    // Si se creó, lo eliminamos inmediatamente para no ensuciar el CRM
    const created = await createRes.json();
    if (created.id) {
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${created.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${cleanToken}` }
      });
    }
    
    res.json({ success: true, message: 'Conexión exitosa. El token es válido y tiene los permisos correctos.' });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

export default integrationRoutes;
