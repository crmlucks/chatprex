import express from 'express';
import pool from './db';

const aiConfigRouter = express.Router();

// Obtener configuración de IA
aiConfigRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT provider, model, api_key, prompt FROM ai_config LIMIT 1');
    if (result.rowCount === 0) {
      return res.json({ provider: 'OpenAI', model: 'gpt-3.5-turbo', api_key: '', prompt: '' });
    }
    
    const config = result.rows[0];
    
    // Ocultar parcialmente la API KEY por seguridad al enviarla al frontend
    let safeApiKey = config.api_key;
    if (safeApiKey && safeApiKey.length > 10) {
      safeApiKey = safeApiKey.substring(0, 4) + '...' + safeApiKey.substring(safeApiKey.length - 4);
    }

    res.json({
      provider: config.provider,
      model: config.model,
      prompt: config.prompt,
      hasApiKey: !!config.api_key,
      safeApiKey
    });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ error: 'Failed to fetch AI config' });
  }
});

// Actualizar configuración de IA
aiConfigRouter.post('/', async (req, res) => {
  const { provider, model, api_key, prompt } = req.body;
  try {
    // Verificar si ya existe registro
    const check = await pool.query('SELECT id, api_key FROM ai_config LIMIT 1');
    
    let apiKeyToSave = api_key;
    if (check.rowCount > 0 && api_key === 'UNCHANGED') {
      apiKeyToSave = check.rows[0].api_key;
    }

    if (check.rowCount === 0) {
      await pool.query(
        'INSERT INTO ai_config (provider, model, api_key, prompt) VALUES ($1, $2, $3, $4)',
        [provider, model, apiKeyToSave, prompt]
      );
    } else {
      await pool.query(
        'UPDATE ai_config SET provider = $1, model = $2, api_key = $3, prompt = $4, updated_at = NOW() WHERE id = $5',
        [provider, model, apiKeyToSave, prompt, check.rows[0].id]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating AI config:', error);
    res.status(500).json({ error: 'Failed to update AI config' });
  }
});

export { aiConfigRouter };
