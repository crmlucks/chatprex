import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar OpenAI (solo funcionará si hay una API Key válida en el archivo .env)
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('🤖 Motor OpenAI inicializado correctamente.');
  } else {
    console.log('⚠️ No se encontró OPENAI_API_KEY. Usando el motor de simulación de IA.');
  }
} catch (e) {
  console.log('⚠️ Error al inicializar OpenAI. Usando simulación de IA.');
}

// Prompt del sistema: Define la personalidad y reglas del bot
const SYSTEM_PROMPT = `Eres un asesor inmobiliario experto y persuasivo de ChatPrex.
Tu objetivo es perfilar leads (clientes potenciales), responder sus dudas sobre propiedades y agendar citas.
Reglas:
1. Sé amable, conciso y utiliza emojis moderadamente.
2. Si preguntan por precios, diles que los departamentos empiezan desde $85,000 USD y las casas desde $120,000 USD.
3. Si muestran interés de compra, invítalos a agendar una llamada o visita.
4. Responde SIEMPRE en español, como si estuvieras chateando por WhatsApp.`;

// Memoria a corto plazo para no perder el contexto de la conversación (almacena por número de teléfono)
const conversationHistory: Record<string, { role: 'system' | 'user' | 'assistant', content: string }[]> = {};

/**
 * Procesa un mensaje entrante y genera una respuesta de IA
 * @param fromJid El ID de WhatsApp del remitente
 * @param textMessage El texto del mensaje recibido
 * @returns La respuesta generada por la IA
 */
export const generateAIResponse = async (fromJid: string, textMessage: string): Promise<string> => {
  // Inicializar el historial para este usuario si no existe
  if (!conversationHistory[fromJid]) {
    conversationHistory[fromJid] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];
  }

  // Añadir el mensaje del usuario al historial
  conversationHistory[fromJid].push({ role: 'user', content: textMessage });

  // Mantener solo los últimos 10 mensajes para ahorrar memoria/tokens
  if (conversationHistory[fromJid].length > 11) {
    // Preservar el prompt del sistema y eliminar los más viejos
    conversationHistory[fromJid] = [
      conversationHistory[fromJid][0],
      ...conversationHistory[fromJid].slice(-10)
    ];
  }

  try {
    // Si tenemos una API key válida, usar OpenAI GPT-4o-mini o GPT-3.5
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Se puede cambiar a gpt-4o para mayor inteligencia
        messages: conversationHistory[fromJid] as any,
        temperature: 0.7,
        max_tokens: 150,
      });

      const aiText = completion.choices[0].message?.content || 'Disculpa, no entendí bien.';
      conversationHistory[fromJid].push({ role: 'assistant', content: aiText });
      return aiText;
    } 
    
    // Si NO hay API Key, usar simulación local basada en palabras clave
    else {
      let mockResponse = '';
      const textLower = textMessage.toLowerCase();

      if (textLower.includes('precio') || textLower.includes('costo') || textLower.includes('cuanto')) {
        mockResponse = "¡Hola! 👋 Te comento que nuestros departamentos comienzan desde $85,000 USD y las casas desde $120,000 USD. ¿Estás buscando algo en particular (casa, depa, terreno)?";
      } else if (textLower.includes('cita') || textLower.includes('visita') || textLower.includes('ver')) {
        mockResponse = "¡Excelente! 📅 ¿Qué día de la semana te queda mejor para agendar una visita guiada?";
      } else if (textLower.includes('hola') || textLower.includes('buen')) {
        mockResponse = "¡Hola! Bienvenido a ChatPrex Inmobiliaria 🏡. Soy tu asesor virtual. ¿En qué tipo de propiedad estás interesado hoy?";
      } else {
        mockResponse = "Entiendo. Para poder brindarte la mejor asesoría, ¿podrías darme un poco más de detalles sobre lo que estás buscando? ✨";
      }

      conversationHistory[fromJid].push({ role: 'assistant', content: mockResponse });
      
      // Simular un retraso de red (como si la IA estuviera pensando)
      await new Promise(resolve => setTimeout(resolve, 1500));
      return mockResponse;
    }
  } catch (error) {
    console.error('Error generando respuesta de IA:', error);
    return "Lo siento, tuve un pequeño problema técnico en este momento. 😅 En breve un agente humano te atenderá.";
  }
};
