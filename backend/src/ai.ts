import OpenAI from 'openai';
import pool from './db';

// Memoria a corto plazo para no perder el contexto de la conversación
const conversationHistory: Record<string, { role: 'system' | 'user' | 'assistant', content: string }[]> = {};

/**
 * Obtiene la configuración de IA asignada al lead (Multi-Bot)
 */
async function getAIConfig(phone: string) {
  try {
    const leadRes = await pool.query('SELECT bot_id FROM leads WHERE phone = $1', [phone]);
    const botId = leadRes.rowCount > 0 && leadRes.rows[0].bot_id ? leadRes.rows[0].bot_id : 1;
    
    const res = await pool.query('SELECT name, provider, model, api_key, prompt, knowledge, human_handoff FROM ai_config WHERE id = $1', [botId]);
    if (res.rowCount > 0) {
      return { ...res.rows[0], botId };
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
  const phone = fromJid.split('@')[0].split(':')[0];
  const config = await getAIConfig(phone);
  
  let systemPrompt = config?.prompt || 'Eres un asistente.';
  const provider = config?.provider || 'OpenAI';
  const model = config?.model || 'gpt-4o-mini';
  const apiKey = config?.api_key || '';
  const knowledge = config?.knowledge || '';
  const humanHandoff = config?.human_handoff !== false;

  // Handoff: detectar si el usuario pide hablar con un humano
  if (humanHandoff) {
    const lower = textMessage.toLowerCase();
    const handoffWords = ['humano', 'asesor', 'agente', 'persona real', 'hablar con alguien'];
    if (handoffWords.some(w => lower.includes(w))) {
      // Desactivar bot para este lead
      try {
        const phone = fromJid.split('@')[0].split(':')[0];
        await pool.query('UPDATE leads SET bot_active = false WHERE phone = $1', [phone]);
        console.log(`[AI] 🤝 Handoff activado para ${phone}`);
      } catch {}
      return '¡Entendido! Te comunico con un asesor humano. En breve te atenderá personalmente. 🙋‍♂️';
    }
  }

  // Cargar propiedades disponibles desde la base de datos para inyectarlas como contexto
  let propertiesText = "";
  try {
    const botName = config?.name || 'Bot Principal';
    
    let query = "SELECT name, project, type, price, currency, location, rooms, area FROM properties WHERE status = 'Disponible'";
    let params: any[] = [];
    
    // Si el bot tiene un nombre específico de proyecto, filtramos el inventario
    if (botName !== 'Bot Principal' && botName !== 'Nuevo Bot') {
      query += " AND (project ILIKE $1 OR name ILIKE $1)";
      params.push(`%${botName}%`);
    }
    query += " LIMIT 20";

    const props = await pool.query(query, params);
    if (props.rowCount > 0) {
      propertiesText = props.rows.map(p => 
        `- ${p.name} (${p.type}${p.project ? ` en ${p.project}` : ''}): Precio ${p.price} ${p.currency}, Ubicación: ${p.location}, Cuartos: ${p.rooms}, Área: ${p.area}`
      ).join('\n');
    }
  } catch (e) {
    console.error("[AI] Error al cargar propiedades:", e);
  }

  // Agregar regla estricta anti-alucinación y Fecha Actual
  const now = new Date();
  systemPrompt += `\n\n--- FECHA Y HORA ACTUAL ---
La fecha y hora actual es: ${now.toLocaleString('es-PE', { timeZone: 'America/Lima' })}. Usa esto como referencia para agendar citas.

--- REGLA ESTRICTA DE VERACIDAD ---
ESTÁ ESTRICTAMENTE PROHIBIDO INVENTAR propiedades, precios, amenidades o características. 
DEBES basar tus respuestas ÚNICAMENTE en la "Base de Conocimiento" y en el "Inventario Disponible". 
Si el cliente pregunta algo que no está en los datos proporcionados, DEBES indicar que no tienes esa información a la mano y que un asesor humano lo confirmará a la brevedad. NO ASUMAS NADA.`;

  // Agregar base de conocimiento al system prompt
  if (knowledge) {
    systemPrompt += `\n\n--- BASE DE CONOCIMIENTO MANUAL ---\n${knowledge}\n---`;
  }

  // Agregar inventario en tiempo real
  if (propertiesText) {
    systemPrompt += `\n\n--- INVENTARIO DISPONIBLE EN TIEMPO REAL ---\n${propertiesText}\n---`;
  } else {
    systemPrompt += `\n\n--- INVENTARIO DISPONIBLE ---\nActualmente no hay propiedades disponibles en el inventario.\n---`;
  }

  if (!conversationHistory[fromJid]) {
    conversationHistory[fromJid] = [
      { role: 'system', content: systemPrompt }
    ];
  } else {
    // Actualizar el prompt del sistema siempre por si cambió
    conversationHistory[fromJid][0].content = systemPrompt;
  }

  conversationHistory[fromJid].push({ role: 'user', content: textMessage });

  // Limitar historial a 10 mensajes + system
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
        mockResponse = "¡Hola! Nuestros departamentos comienzan desde $85,000 USD. ¿Buscas casa o departamento? 🏡";
      } else if (textLower.includes('cita') || textLower.includes('visita')) {
        mockResponse = "¡Excelente! ¿Qué día de la semana te queda mejor para una visita? 📅";
      } else if (textLower.includes('hola') || textLower.includes('buenos') || textLower.includes('hi')) {
        mockResponse = "¡Hola! 👋 Soy tu asesora virtual. ¿En qué puedo ayudarte hoy?";
      } else {
        mockResponse = "Entiendo. ¿Podrías darme un poco más de detalles sobre lo que buscas? Así puedo darte la mejor opción 😊";
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

    const tools = [
      {
        type: "function",
        function: {
          name: "agendar_cita",
          description: "Agenda una nueva cita o visita en el calendario del CRM.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Asunto de la cita (ej. Visita al proyecto X)" },
              date_iso: { type: "string", description: "Fecha y hora en formato ISO 8601 (ej. 2026-05-12T10:00:00-05:00)" },
              description: { type: "string", description: "Notas adicionales sobre la visita" }
            },
            required: ["title", "date_iso"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reprogramar_cita",
          description: "Reprograma la cita pendiente del cliente a una nueva fecha y hora.",
          parameters: {
            type: "object",
            properties: {
              new_date_iso: { type: "string", description: "Nueva fecha y hora en formato ISO 8601" }
            },
            required: ["new_date_iso"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cancelar_cita",
          description: "Cancela la cita pendiente del cliente.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      }
    ];

    let completion = await openai.chat.completions.create({
      model: model,
      messages: conversationHistory[fromJid] as any,
      temperature: 0.7,
      max_tokens: 300,
      tools: tools as any,
      tool_choice: "auto",
    });

    let responseMessage = completion.choices[0].message;

    // Procesar llamada a herramientas (Function Calling)
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      conversationHistory[fromJid].push(responseMessage as any);
      
      const leadRes = await pool.query('SELECT id FROM leads WHERE phone = $1', [phone]);
      const leadId = leadRes.rowCount > 0 ? leadRes.rows[0].id : null;

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        try {
          const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
          
          if (functionName === 'agendar_cita') {
            await pool.query(
              "INSERT INTO tasks (title, description, type, status, due_date, lead_id) VALUES ($1, $2, 'cita', 'pendiente', $3, $4)",
              [args.title, args.description || '', args.date_iso, leadId]
            );
            conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: "Cita agendada exitosamente en la base de datos." } as any);
          } 
          else if (functionName === 'reprogramar_cita') {
            const updateRes = await pool.query(
              "UPDATE tasks SET due_date = $1 WHERE lead_id = $2 AND type = 'cita' AND status = 'pendiente' RETURNING id",
              [args.new_date_iso, leadId]
            );
            if (updateRes.rowCount && updateRes.rowCount > 0) {
              conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: "Cita reprogramada exitosamente." } as any);
            } else {
              conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: "No se encontró ninguna cita pendiente para reprogramar." } as any);
            }
          }
          else if (functionName === 'cancelar_cita') {
            const delRes = await pool.query(
              "DELETE FROM tasks WHERE lead_id = $1 AND type = 'cita' AND status = 'pendiente' RETURNING id",
              [leadId]
            );
            if (delRes.rowCount && delRes.rowCount > 0) {
              conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: "Cita cancelada exitosamente." } as any);
            } else {
              conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: "No se encontró ninguna cita pendiente para cancelar." } as any);
            }
          }
        } catch (e: any) {
          conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: `Error del sistema al ejecutar la función: ${e.message}` } as any);
        }
      }

      // Obtener respuesta final de la IA después de ejecutar la herramienta
      completion = await openai.chat.completions.create({
        model: model,
        messages: conversationHistory[fromJid] as any,
        temperature: 0.7,
        max_tokens: 250,
      });
      responseMessage = completion.choices[0].message;
    }

    const aiText = responseMessage.content || 'Cita procesada con éxito.';
    conversationHistory[fromJid].push({ role: 'assistant', content: aiText });
    return aiText;

  } catch (error: any) {
    console.error(`[AI ${provider}] Error generando respuesta:`, error.message);
    return "Lo siento, tuve un problema procesando tu mensaje. En breve un agente te atenderá. 🙏";
  }
};
