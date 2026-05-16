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
    
    const res = await pool.query('SELECT name, provider, model, api_key, prompt, knowledge, human_handoff, activation_keywords FROM ai_config WHERE id = $1', [botId]);
    if (res.rowCount > 0) {
      return { ...res.rows[0], botId };
    }
  } catch (e) {
    console.error('[OpenAI/AI] Error general:', e);
  }
  return null;
}

/**
 * Agrega un mensaje al historial en memoria de la IA.
 * Útil para que la IA tenga contexto de los mensajes manuales que envió el humano
 * o los mensajes que envió el lead mientras el bot estaba apagado.
 */
export const appendMessageToHistory = (fromJid: string, role: 'user' | 'assistant', content: string) => {
  if (!conversationHistory[fromJid]) {
    conversationHistory[fromJid] = [];
  }
  conversationHistory[fromJid].push({ role, content });
  
  // Mantener el límite de 10 mensajes
  if (conversationHistory[fromJid].length > 11) {
    const hasSystem = conversationHistory[fromJid][0]?.role === 'system';
    if (hasSystem) {
      conversationHistory[fromJid] = [
        conversationHistory[fromJid][0],
        ...conversationHistory[fromJid].slice(-10)
      ];
    } else {
      conversationHistory[fromJid] = conversationHistory[fromJid].slice(-10);
    }
  }
};

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
    const keywords = (config?.activation_keywords || '').split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
    
    let query = "SELECT name, project, type, price, currency, location, rooms, area, details FROM properties WHERE status ILIKE 'disponible'";
    let params: any[] = [];
    
    // Si el bot no se llama 'Bot Principal', filtramos
    if (botName !== 'Bot Principal' && botName !== 'Nuevo Bot') {
      const conditions = ["project ILIKE $1", "name ILIKE $1"];
      params.push(`%${botName}%`);
      
      let paramIndex = 2;
      for (const kw of keywords) {
        conditions.push(`project ILIKE $${paramIndex}`);
        conditions.push(`name ILIKE $${paramIndex}`);
        params.push(`%${kw}%`);
        paramIndex++;
      }
      
      query += ` AND (${conditions.join(' OR ')})`;
    }

    query += " LIMIT 20";

    const props = await pool.query(query, params);
    if (props.rowCount > 0) {
      propertiesText = props.rows.map(p => 
        `- ${p.name} (${p.type}${p.project ? ` en ${p.project}` : ''}): Precio ${p.price} ${p.currency}, Ubicación: ${p.location}, Cuartos: ${p.rooms}, Área: ${p.area}. Detalles: ${p.details}`
      ).join('\n');
    }
  } catch (e) {
    console.error("[AI] Error al cargar propiedades:", e);
  }

  // Obtener información del asesor asignado al lead
  let advisorText = "Aún no hay un asesor específico asignado. Un miembro del equipo se comunicará.";
  try {
    const phone = fromJid.split('@')[0].split(':')[0];
    const advRes = await pool.query(`
      SELECT u.name, u.phone FROM leads l 
      LEFT JOIN users u ON l.advisor_id = u.id 
      WHERE l.phone = $1
    `, [phone]);
    if (advRes.rowCount > 0 && advRes.rows[0].name) {
      advisorText = `Nombre: ${advRes.rows[0].name}. Teléfono: ${advRes.rows[0].phone || 'No disponible'}.`;
    }
  } catch (e) {}

  // Agregar regla estricta anti-alucinación y Fecha Actual
  const now = new Date();
  systemPrompt += `\n\n--- FECHA Y HORA ACTUAL ---
La fecha y hora actual es: ${now.toLocaleString('es-PE', { timeZone: 'America/Lima' })}. Usa esto como referencia para agendar citas.

--- REGLAS DE SISTEMA ---
1. ESTÁ ESTRICTAMENTE PROHIBIDO INVENTAR propiedades, precios, amenidades o características.
2. DEBES basar tus respuestas ÚNICAMENTE en la "Base de Conocimiento" y en el "Inventario Disponible".
3. Si el cliente pregunta algo que no está en los datos proporcionados, DEBES indicar que no tienes esa información a la mano y que un asesor humano lo confirmará a la brevedad. NO ASUMAS NADA.
4. Si aún no sabes el nombre del cliente, intenta preguntárselo sutilmente en algún punto de la conversación. Si el cliente te proporciona su nombre, DEBES ejecutar la función "actualizar_nombre" para registrarlo en el CRM.
5. Si el cliente menciona su presupuesto, proyecto de interés o detalles de lo que busca (ej. casa de campo, frente al parque, servicios básicos), DEBES ejecutar la función "registrar_perfil_lead" para guardar automáticamente su perfil.
6. Si el cliente pide fotos, imágenes o un video del proyecto, DEBES ejecutar la función "solicitar_multimedia_proyecto". Cuando la herramienta te devuelva la etiqueta [MEDIA:...], DEBES incluir ESA ETIQUETA EXACTA al final de tu respuesta.

--- DATOS REALES DE TU ASESOR ASIGNADO ---
ATENCIÓN IA: Cuando el prompt principal o el cliente te pida derivarlo con su asesor, o tu prompt diga "[Nombre]", DEBES REEMPLAZARLO OBLIGATORIAMENTE por este nombre real:
${advisorText}
---`;

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
      },
      {
        type: "function",
        function: {
          name: "actualizar_nombre",
          description: "Actualiza el nombre del cliente en la base de datos CRM si el usuario te lo proporciona en el chat.",
          parameters: {
            type: "object",
            properties: {
              nuevo_nombre: { type: "string", description: "El nombre que el usuario proporcionó (ej. Fausto Meza)" }
            },
            required: ["nuevo_nombre"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "registrar_perfil_lead",
          description: "Registra o actualiza el perfil del cliente (proyecto de interés, presupuesto, y detalles de lo que busca) en el CRM de forma automática.",
          parameters: {
            type: "object",
            properties: {
              proyecto_interes: { type: "string", description: "Nombre del proyecto por el que preguntó o mostró interés (Identifícalo de la conversación)." },
              presupuesto: { type: "string", description: "Presupuesto del cliente. Si elige un lote de la lista de alternativas, DEBES ASUMIR como presupuesto el precio exacto de ese lote elegido." },
              detalles_interes: { type: "string", description: "Características específicas que busca (ej. casa de campo, frente al parque, servicios básicos, esquina, etc)." }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "solicitar_multimedia_proyecto",
          description: "Busca y obtiene las URLs de las fotos o videos del proyecto para enviárselas al cliente.",
          parameters: {
            type: "object",
            properties: {
              proyecto: { type: "string", description: "Nombre del proyecto del que se piden fotos (ej. 'Alquimia', 'Praderas')." }
            },
            required: ["proyecto"]
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
          else if (functionName === 'actualizar_nombre') {
            await pool.query(
              "UPDATE leads SET name = $1 WHERE id = $2",
              [args.nuevo_nombre, leadId]
            );
            conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: `Nombre del lead actualizado exitosamente a ${args.nuevo_nombre} en la base de datos CRM.` } as any);
          }
          else if (functionName === 'registrar_perfil_lead') {
            const currentRes = await pool.query("SELECT project, budget, interest FROM leads WHERE id = $1", [leadId]);
            if (currentRes.rowCount > 0) {
              const current = currentRes.rows[0];
              const p_project = args.proyecto_interes || current.project;
              const p_budget = args.presupuesto || current.budget;
              
              let p_interest = current.interest || '';
              if (args.detalles_interes) {
                // Si ya hay intereses previos, los concatenamos de forma ordenada
                p_interest = p_interest ? p_interest + " | " + args.detalles_interes : args.detalles_interes;
              }
              
              await pool.query(
                "UPDATE leads SET project = $1, budget = $2, interest = $3 WHERE id = $4",
                [p_project, p_budget, p_interest, leadId]
              );
              conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: "Perfil del cliente (proyecto, presupuesto e intereses) actualizado exitosamente en el CRM." } as any);
            } else {
              conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: "Error: No se pudo actualizar el perfil porque el lead no existe." } as any);
            }
          }
          else if (functionName === 'solicitar_multimedia_proyecto') {
            const propRes = await pool.query("SELECT image, images FROM properties WHERE project ILIKE $1 OR name ILIKE $1 LIMIT 1", [`%${args.proyecto}%`]);
            if (propRes.rowCount > 0) {
              const p = propRes.rows[0];
              let urls = [];
              if (p.image) urls.push(p.image);
              if (p.images && Array.isArray(p.images)) {
                urls.push(...p.images);
              }
              urls = urls.filter((u: string) => u && u.startsWith('http')).slice(0, 4);
              if (urls.length > 0) {
                conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: `Encontré ${urls.length} imágenes. DEBES incluir EXACTAMENTE esta etiqueta al final de tu respuesta al cliente: [MEDIA:${urls.join('|')}]` } as any);
              } else {
                conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: "No hay fotos registradas para este proyecto en la base de datos." } as any);
              }
            } else {
              conversationHistory[fromJid].push({ role: "tool", tool_call_id: toolCall.id, content: "No se encontró ningún proyecto con ese nombre." } as any);
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
