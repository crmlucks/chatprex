import express from 'express';
import pool from './db';
import OpenAI from 'openai';

const aiConfigRouter = express.Router();

// Obtener configuración de IA
aiConfigRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT provider, model, api_key, prompt, knowledge, voice_to_text, message_grouping, humanized_split, human_handoff FROM ai_config LIMIT 1');
    if (result.rowCount === 0) {
      return res.json({ provider: 'OpenAI', model: 'gpt-4o-mini', hasApiKey: false, safeApiKey: '', prompt: '', knowledge: '' });
    }
    
    const config = result.rows[0];
    
    // Ocultar parcialmente la API KEY por seguridad
    let safeApiKey = config.api_key;
    if (safeApiKey && safeApiKey.length > 10) {
      safeApiKey = safeApiKey.substring(0, 4) + '...' + safeApiKey.substring(safeApiKey.length - 4);
    }

    res.json({
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
    });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ error: 'Failed to fetch AI config' });
  }
});

// Actualizar configuración de IA
aiConfigRouter.post('/', async (req, res) => {
  const { provider, model, api_key, prompt, knowledge, voiceToText, messageGrouping, humanizedSplit, humanHandoff } = req.body;
  try {
    const check = await pool.query('SELECT id, api_key FROM ai_config LIMIT 1');
    
    let apiKeyToSave = api_key;
    if (check.rowCount > 0 && api_key === 'UNCHANGED') {
      apiKeyToSave = check.rows[0].api_key;
    }

    if (check.rowCount === 0) {
      await pool.query(
        `INSERT INTO ai_config (provider, model, api_key, prompt, knowledge, voice_to_text, message_grouping, humanized_split, human_handoff)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [provider, model, apiKeyToSave, prompt, knowledge || '', voiceToText !== false, messageGrouping !== false, humanizedSplit !== false, humanHandoff !== false]
      );
    } else {
      await pool.query(
        `UPDATE ai_config SET provider=$1, model=$2, api_key=$3, prompt=$4, knowledge=$5,
         voice_to_text=$6, message_grouping=$7, humanized_split=$8, human_handoff=$9, updated_at=NOW()
         WHERE id=$10`,
        [provider, model, apiKeyToSave, prompt, knowledge || '', voiceToText !== false, messageGrouping !== false, humanizedSplit !== false, humanHandoff !== false, check.rows[0].id]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating AI config:', error);
    res.status(500).json({ error: 'Failed to update AI config' });
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
