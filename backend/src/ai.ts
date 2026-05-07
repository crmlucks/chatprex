import OpenAI from 'openai';
import pool from './db';

// Memoria a corto plazo para no perder el contexto de la conversación
const conversationHistory: Record<string, { role: 'system' | 'user' | 'assistant', content: string }[]> = {};

/**
 * Obtiene la configuración actual de la IA desde la BD
 */
async function getAIConfig() {
  try {
    const res = await pool.query('SELECT provider, model, api_key, prompt FROM ai_config LIMIT 1');
    if (res.rowCount > 0) {
      return res.rows[0];
    }
  } catch (e) {
    console.error('Error leyendo config IA:', e);
  }
  return null;
}

/**
 * Genera respuesta usando el proveedor configurado
 */
export const generateAIResponse = async (fromJid: string, textMessage: string): Promise<string> => {
  const config = await getAIConfig();
  
  const systemPrompt = config?.prompt || 'Eres un asistente.';
  const provider = config?.provider || 'OpenAI';
  const model = config?.model || 'gpt-3.5-turbo';
  const apiKey = config?.api_key || '';

  if (!conversationHistory[fromJid]) {
    conversationHistory[fromJid] = [
      { role: 'system', content: systemPrompt }
    ];
  } else {
    // Actualizar el prompt del sistema siempre por si cambió
    conversationHistory[fromJid][0].content = systemPrompt;
  }

  conversationHistory[fromJid].push({ role: 'user', content: textMessage });

  if (conversationHistory[fromJid].length > 11) {
    conversationHistory[fromJid] = [
      conversationHistory[fromJid][0],
      ...conversationHistory[fromJid].slice(-10)
    ];
  }

  try {
    // Si NO hay API Key, usar simulación
    if (!apiKey) {
      let mockResponse = '';
      const textLower = textMessage.toLowerCase();
      if (textLower.includes('precio') || textLower.includes('costo')) {
        mockResponse = "¡Hola! Nuestros depas comienzan desde $85,000 USD. ¿Buscas casa o depa?";
      } else if (textLower.includes('cita') || textLower.includes('visita')) {
        mockResponse = "¡Excelente! ¿Qué día de la semana te queda mejor?";
      } else {
        mockResponse = "Entiendo. ¿Podrías darme un poco más de detalles sobre lo que buscas?";
      }
      conversationHistory[fromJid].push({ role: 'assistant', content: mockResponse });
      await new Promise(resolve => setTimeout(resolve, 1500));
      return mockResponse;
    }

    // Configurar cliente OpenAI según proveedor
    let baseURL = undefined;
    if (provider === 'Groq') {
      baseURL = 'https://api.groq.com/openai/v1';
    } else if (provider === 'DeepSeek') {
      baseURL = 'https://api.deepseek.com';
    } else if (provider === 'Gemini') {
      baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });

    const completion = await openai.chat.completions.create({
      model: model,
      messages: conversationHistory[fromJid] as any,
      temperature: 0.7,
      max_tokens: 150,
    });

    const aiText = completion.choices[0].message?.content || 'Disculpa, no entendí bien.';
    conversationHistory[fromJid].push({ role: 'assistant', content: aiText });
    return aiText;

  } catch (error: any) {
    console.error(`[AI ${provider}] Error generando respuesta:`, error.message);
    return "Lo siento, tuve un problema procesando tu mensaje. En breve un agente te atenderá.";
  }
};
