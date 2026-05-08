import express from 'express';
import pool from './db';
import OpenAI from 'openai';

const aiConfigRouter = express.Router();

// Obtener todos los bots
aiConfigRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, provider, model, api_key, prompt, knowledge, voice_to_text, message_grouping, humanized_split, human_handoff, activation_keywords FROM ai_config ORDER BY id ASC');
    if (result.rowCount === 0) {
      // Si no hay ninguno, devolver uno por defecto en el array
      return res.json([{ id: 1, name: 'Bot Principal', provider: 'OpenAI', model: 'gpt-4o-mini', hasApiKey: false, safeApiKey: '', prompt: '', knowledge: '', activationKeywords: 'info,precio,quiero,asesor,comprar' }]);
    }
    
    const bots = result.rows.map(config => {
      let safeApiKey = config.api_key;
      if (safeApiKey && safeApiKey.length > 10) {
        safeApiKey = safeApiKey.substring(0, 4) + '...' + safeApiKey.substring(safeApiKey.length - 4);
      }
      return {
        id: config.id,
        name: config.name || 'Bot',
        provider: config.provider,
        model: config.model,
        prompt: config.prompt,
        knowledge: config.knowledge || '',
        hasApiKey: !!config.api_key,
        safeApiKey,
        voiceToText: config.voice_to_text !== false,
        messageGrouping: config.message_grouping !== false,
        humanizedSplit: config.humanized_split !== false,
        humanHandoff: config.human_handoff !== false,
        activationKeywords: config.activation_keywords || '',
      };
    });

    res.json(bots);
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ error: 'Failed to fetch AI config' });
  }
});

// Crear o Actualizar bot
aiConfigRouter.post('/', async (req, res) => {
  const { id, name, provider, model, api_key, prompt, knowledge, voiceToText, messageGrouping, humanizedSplit, humanHandoff, activationKeywords } = req.body;
  try {
    let apiKeyToSave = api_key;
    if (id && api_key === 'UNCHANGED') {
      const check = await pool.query('SELECT api_key FROM ai_config WHERE id = $1', [id]);
      if (check.rowCount > 0) apiKeyToSave = check.rows[0].api_key;
    }

    if (!id) {
      // Create new
      const result = await pool.query(
        `INSERT INTO ai_config (name, provider, model, api_key, prompt, knowledge, voice_to_text, message_grouping, humanized_split, human_handoff, activation_keywords)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [name || 'Nuevo Bot', provider, model, apiKeyToSave || '', prompt, knowledge || '', voiceToText !== false, messageGrouping !== false, humanizedSplit !== false, humanHandoff !== false, activationKeywords || '']
      );
      return res.json({ success: true, id: result.rows[0].id });
    } else {
      // Update existing
      await pool.query(
        `UPDATE ai_config SET name=$1, provider=$2, model=$3, api_key=$4, prompt=$5, knowledge=$6,
         voice_to_text=$7, message_grouping=$8, humanized_split=$9, human_handoff=$10, activation_keywords=$11, updated_at=NOW()
         WHERE id=$12`,
        [name || 'Bot', provider, model, apiKeyToSave || '', prompt, knowledge || '', voiceToText !== false, messageGrouping !== false, humanizedSplit !== false, humanHandoff !== false, activationKeywords || '', id]
      );
      return res.json({ success: true, id });
    }
  } catch (error) {
    console.error('Error updating AI config:', error);
    res.status(500).json({ error: 'Failed to update AI config' });
  }
});

// Eliminar bot
aiConfigRouter.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ai_config WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bot:', error);
    res.status(500).json({ error: 'Failed to delete bot' });
  }
});

// Probar conexión con IA
aiConfigRouter.post('/test', async (req, res) => {
  const { provider, model, api_key } = req.body;
  try {
    let actualKey = api_key;
    if (api_key === 'UNCHANGED') {
      const dbRes = await pool.query('SELECT api_key FROM ai_config LIMIT 1');
      actualKey = dbRes.rows[0]?.api_key || '';
    }
    if (!actualKey) {
      return res.json({ success: false, error: 'No hay API Key configurada' });
    }

    let baseURL = undefined;
    if (provider === 'Groq') baseURL = 'https://api.groq.com/openai/v1';
    else if (provider === 'DeepSeek') baseURL = 'https://api.deepseek.com';
    else if (provider === 'Gemini') baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

    const openai = new OpenAI({ apiKey: actualKey, baseURL });
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Responde solo: OK' }],
      max_tokens: 10,
    });
    const reply = completion.choices[0].message?.content || '';
    res.json({ success: true, reply });
  } catch (error: any) {
    console.error('AI test error:', error.message);
    res.json({ success: false, error: error.message });
  }
});

// Simulador de IA (prueba en vivo desde el frontend)
aiConfigRouter.post('/simulate', async (req, res) => {
  const { message, prompt, provider, model, api_key, knowledge } = req.body;
  try {
    let actualKey = api_key;
    if (api_key === 'UNCHANGED') {
      const dbRes = await pool.query('SELECT api_key FROM ai_config LIMIT 1');
      actualKey = dbRes.rows[0]?.api_key || '';
    }

    // Build system prompt with knowledge
    let systemPrompt = prompt || 'Eres un asistente.';
    if (knowledge) {
      systemPrompt += `\n\n--- BASE DE CONOCIMIENTO ---\nUsa esta información para responder con precisión:\n${knowledge}\n---`;
    }

    if (!actualKey) {
      // Simulated response when no API key
      const lower = message.toLowerCase();
      let reply = 'Entiendo, ¿podrías darme más detalles sobre lo que buscas?';
      if (lower.includes('precio') || lower.includes('costo')) reply = '¡Hola! Los departamentos empiezan desde $120,000 USD. ¿Cuántas habitaciones buscas?';
      else if (lower.includes('hola') || lower.includes('buenos')) reply = '¡Hola! Soy tu asesora virtual. ¿En qué puedo ayudarte hoy? 😊';
      else if (lower.includes('cita') || lower.includes('visita')) reply = '¡Excelente! Podemos agendar una visita. ¿Qué día te queda mejor?';
      else if (lower.includes('ubicación') || lower.includes('donde')) reply = 'Estamos ubicados en una zona exclusiva con fácil acceso. ¿Te gustaría conocer el proyecto?';
      return res.json({ reply: `[SIMULADO] ${reply}` });
    }

    let baseURL = undefined;
    if (provider === 'Groq') baseURL = 'https://api.groq.com/openai/v1';
    else if (provider === 'DeepSeek') baseURL = 'https://api.deepseek.com';
    else if (provider === 'Gemini') baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

    const openai = new OpenAI({ apiKey: actualKey, baseURL });
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const reply = completion.choices[0].message?.content || 'Sin respuesta de la IA.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Simulate error:', error.message);
    res.json({ reply: `Error: ${error.message}` });
  }
});

export { aiConfigRouter };
