import { Server } from 'socket.io';
import express from 'express';
import { handleVoiceMessage } from './voiceBot';
import { generateAIResponse, appendMessageToHistory } from './ai';
import { sendToN8N } from './n8nIntegration';
import pool from './db';

// Router que expondrá los endpoints de webhook de WhatsApp Cloud API
const whatsappRouter = express.Router();
export const aiModeRouter = express.Router();

let globalUseN8n = false;

aiModeRouter.post('/', (req, res) => {
  if (typeof req.body.useN8n === 'boolean') {
    globalUseN8n = req.body.useN8n;
  }
  res.json({ useN8n: globalUseN8n });
});
aiModeRouter.get('/', (req, res) => {
  res.json({ useN8n: globalUseN8n });
});

// Variables de entorno para la API oficial de Meta
const META_TOKEN = process.env.META_WHATSAPP_TOKEN || '';
const META_PHONE_ID = process.env.META_WHATSAPP_PHONE_ID || '';
// Token que usaremos para validar que el webhook es llamado por Meta
const META_VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN || 'whatsapp_verify';

let ioInstance: Server | null = null;

/**
 * Inicializa la integración de WhatsApp con Socket.io.
 * Se encarga de:
 *   • Guardar la referencia a `io` para poder emitir eventos al frontend.
 *   • Registrar los listeners del socket para enviar mensajes.
 *   • Informar al cliente el estado de la conexión (connected / error).
 */
export const initWhatsApp = async (io: Server) => {
  ioInstance = io;

  // Cuando un cliente se conecta vía socket
  io.on('connection', (socket) => {
    // Envíamos el estado actual de la API (intenta consultar el número)
    checkWhatsAppStatus();

    // Escuchamos peticiones del frontend para enviar mensajes
    socket.on('send-message', async (data: { to: string; text: string; media?: string; mimeType?: string }) => {
      try {
        await sendWhatsAppMessage(data.to, data.text, data.media, data.mimeType);
        socket.emit('send-message-success', { to: data.to });
      } catch (err) {
        console.error('Error enviando mensaje vía WhatsApp Cloud API', err);
        socket.emit('send-message-error', { error: String(err) });
      }
    });
  });
};

/**
 * Verifica el webhook de Meta (GET). Meta envía los parámetros `hub.mode`,
 * `hub.verify_token` y `hub.challenge`. Respondemos con el challenge si el token
 * coincide, de lo contrario devolvemos 403.
 */
whatsappRouter.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN && challenge) {
    console.log('✅ Webhook de WhatsApp verificado correctamente');
    res.send(String(challenge));
  } else {
    res.sendStatus(403);
  }
});

/**
 * Endpoint al que Meta enviará los eventos (POST). Procesamos los mensajes
 * entrantes y los retransmitimos al cliente mediante Socket.io.
 */
whatsappRouter.post('/', async (req, res) => {
  const body = req.body;

  if (ioInstance) {
    // Detect voice messages (type 'audio' or 'voice')
    if (body.object === 'whatsapp_business_account' && body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        const changes = entry.changes;
        if (!changes || !Array.isArray(changes)) continue;
        for (const change of changes) {
          const value = change.value;
          const messages = value?.messages;
          if (messages && Array.isArray(messages)) {
            for (const msg of messages) {
              const from = msg.from;
              // Extraemos el nombre de contacto provisto por Meta si existe
              const pushName = value.contacts && value.contacts[0] ? value.contacts[0].profile.name : from;
              let text = msg.text?.body || '[Multimedia]';
              let mediaUrl = undefined;
              let mimeType = undefined;
              
              // Detect audio (voice) messages
              if (msg.type === 'audio' && msg.audio?.id) {
                // Transcribe the voice message
                const transcription = await handleVoiceMessage(msg.audio.id, msg.audio.mime_type);
                if (transcription) {
                  text = transcription;
                  mimeType = msg.audio.mime_type;
                }
              }

              const msgTimestamp = msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString();

              // Emitir al frontend para UI en tiempo real
              ioInstance.emit('whatsapp-message', {
                id: msg.id,
                from,
                name: pushName,
                text,
                fromMe: false,
                timestamp: msgTimestamp,
              });

              // --- 1. GUARDAR EL MENSAJE EN LA BASE DE DATOS ---
              try {
                await pool.query(
                  `INSERT INTO evolution_messages (id, chat_id, text, from_me, timestamp, media_url, media_type)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   ON CONFLICT (id) DO NOTHING`,
                  [msg.id, from, text, false, msgTimestamp, mediaUrl || null, mimeType || null]
                );
              } catch (dbErr: any) {
                console.error('[Meta] Error guardando mensaje en BD:', dbErr.message);
              }

              // --- 2. AUTO-REGISTRO DE LEADS Y ESTADO DEL BOT ---
              let isBotActive = false;
              let matchedBotId = 1;
              const phone = from;
              
              try {
                const existRes = await pool.query('SELECT id, bot_active FROM leads WHERE phone = $1', [phone]);
                if (existRes.rowCount === 0) {
                  isBotActive = true;
                  let assignedAdvisorId = null;
                  try {
                    const advisorRes = await pool.query(`SELECT id FROM users WHERE status = 'activo' AND auto_assign = true ORDER BY last_assigned_at ASC NULLS FIRST LIMIT 1`);
                    if (advisorRes.rowCount > 0) {
                      assignedAdvisorId = advisorRes.rows[0].id;
                      await pool.query('UPDATE users SET last_assigned_at = NOW() WHERE id = $1', [assignedAdvisorId]);
                    }
                  } catch (err) {}
                  
                  await pool.query(
                    `INSERT INTO leads (name, phone, score, status, bot_active, bot_id, advisor_id, provider) VALUES ($1, $2, '50%', 'Nuevo', $3, $4, $5, 'meta')`,
                    [pushName, phone, isBotActive, matchedBotId, assignedAdvisorId]
                  );
                  ioInstance.emit('new-lead', { name: pushName, phone });
                } else {
                  isBotActive = existRes.rows[0].bot_active;
                }
              } catch (err: any) {
                console.error('[Meta] Error manejando lead:', err.message);
              }

              // --- 3. RESPUESTA DE IA O FLUJO ---
              if (isBotActive) {
                  let aiReply: string | null = null;
                  if (globalUseN8n) {
                    aiReply = await sendToN8N(from, text);
                  }
                  if (!aiReply) {
                    aiReply = await generateAIResponse(from, text);
                  }
                  
                  if (aiReply) {
                    let messagesToSend = [aiReply];
                    if (aiReply.length > 250) {
                      let parts = aiReply.split(/\\r?\\n+/).filter(p => p.trim().length > 0);
                      if (parts.length === 1) {
                        const sentenceRegex = /([^.?!]+[.?!]+)/g;
                        const matches = aiReply.match(sentenceRegex);
                        if (matches && matches.length > 1) {
                          parts = matches.map(s => s.trim());
                        } else {
                          const mid = Math.floor(aiReply.length / 2);
                          const spaceIdx = aiReply.indexOf(' ', mid);
                          if (spaceIdx > 0) {
                            parts = [aiReply.slice(0, spaceIdx).trim(), aiReply.slice(spaceIdx).trim()];
                          }
                        }
                      }
                      if (parts.length > 3) {
                        messagesToSend = [parts[0], parts.slice(1, parts.length - 1).join(' '), parts[parts.length - 1]];
                      } else if (parts.length > 1) {
                        messagesToSend = parts;
                      }
                    }

                    // Guardar respuestas de IA en la BD
                    for (let i = 0; i < messagesToSend.length; i++) {
                      if (messagesToSend[i].trim().length > 0) {
                        const botMsgId = `ai-${msg.id}-${i}`;
                        const botText = messagesToSend[i].trim();
                        
                        ioInstance.emit('whatsapp-message', {
                          id: botMsgId,
                          from: 'bot',
                          name: 'ChatPrex Bot' + (globalUseN8n ? ' (n8n)' : ''),
                          text: botText,
                          fromMe: true,
                          timestamp: new Date().toISOString(),
                        });
                        
                        try {
                          await pool.query(
                            `INSERT INTO evolution_messages (id, chat_id, text, from_me) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
                            [botMsgId, from, botText, true]
                          );
                        } catch (e) {}
                        
                        await sendWhatsAppMessage(from, botText);
                        if (i < messagesToSend.length - 1) {
                          await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
                        }
                      }
                    }
                  }
                  }
                }
            }
          }
        }
      }
    }
  }

  // Respondemos 200 para que Meta no reintente el envío
  res.sendStatus(200);
});

/**
 * Envía un mensaje usando la Cloud API de WhatsApp.
 * Si se proporciona `mediaUrl` se envía como imagen; de lo contrario se envía texto simple.
 */
const sendWhatsAppMessage = async (
  to: string,
  text: string,
  mediaUrl?: string,
  mimeType?: string
) => {
  const endpoint = `https://graph.facebook.com/v13.0/${META_PHONE_ID}/messages`;
  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: mediaUrl ? 'image' : 'text',
    ...(mediaUrl
      ? { image: { link: mediaUrl, caption: text } }
      : { text: { body: text } }),
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${META_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`WhatsApp API error ${response.status}: ${errText}`);
  }
};

/**
 * Comprueba rápidamente si el número de teléfono configurado está activo.
 * Emitimos `meta-whatsapp-status` a los clientes socket.
 */
const checkWhatsAppStatus = async () => {
  if (!ioInstance) return;
  try {
    const endpoint = `https://graph.facebook.com/v13.0/${META_PHONE_ID}?access_token=${META_TOKEN}`;
    const res = await fetch(endpoint);
    if (res.ok) {
      ioInstance.emit('meta-whatsapp-status', 'connected');
    } else {
      const err = await res.text();
      // Only log it, don't emit to 'whatsapp-status' to avoid breaking Evolution API
      console.error('[Meta API] Error:', err);
      ioInstance.emit('meta-whatsapp-status', `error ${res.status}: ${err}`);
    }
  } catch (e: any) {
    ioInstance.emit('meta-whatsapp-status', `network error: ${e.message}`);
  }
};

export { whatsappRouter };
