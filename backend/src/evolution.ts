import { Server } from 'socket.io';
import express from 'express';
import { generateAIResponse } from './ai';
import pool from './db';

// Permitir certificados self-signed dentro de Docker/Coolify
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const evolutionRouter = express.Router();

// Limpiar URL: quitar trailing slash
const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN || '';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'ChatPrex';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://api.chatprex.com/api/webhook/evolution/webhook';

let ioInstance: Server | null = null;
const messageQueue: Record<string, { texts: string[], timer: NodeJS.Timeout | null }> = {};

console.log(`[Evolution] ═══════════════════════════════`);
console.log(`[Evolution] URL:      ${EVOLUTION_API_URL}`);
console.log(`[Evolution] Token:    ${EVOLUTION_API_TOKEN ? EVOLUTION_API_TOKEN.substring(0, 8) + '...' : '(vacío)'}`);
console.log(`[Evolution] Instance: ${INSTANCE_NAME}`);
console.log(`[Evolution] Webhook:  ${WEBHOOK_URL}`);
console.log(`[Evolution] ═══════════════════════════════`);

const getHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_API_TOKEN,
});

/** Fetch con timeout de 15s */
async function safeFetch(url: string, options: any = {}): Promise<Response> {
  return fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
}

// ═══════════════════════════════════════════════════
//  INICIALIZACIÓN SOCKET
// ═══════════════════════════════════════════════════
export const initEvolution = (io: Server) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Evolution] Socket conectado, iniciando flujo QR...`);
    handleEvolutionFlow(socket);

    socket.on('request-evolution-qr', () => {
      console.log(`[Evolution] QR solicitado manualmente por usuario`);
      handleEvolutionFlow(socket);
    });
  });
};

// ═══════════════════════════════════════════════════
//  FLUJO PRINCIPAL: Obtener QR o confirmar conexión
// ═══════════════════════════════════════════════════
async function handleEvolutionFlow(socket: any) {
  try {
    // Paso 1: Verificar si la instancia existe usando fetchInstances
    const instanceExists = await checkInstanceExists();
    console.log(`[Evolution] ¿Instancia existe?: ${instanceExists}`);

    if (instanceExists) {
      // Paso 2A: Intentar conectar para obtener QR
      const qr = await tryConnect();
      if (qr === 'connected') {
        await setWebhook(); // Asegurar webhook configurado
        socket.emit('whatsapp-status', 'connected');
        return;
      }
      if (qr) {
        socket.emit('whatsapp-qr', qr);
        return;
      }

      // Paso 2B: Si connect no devuelve QR, borrar y recrear
      console.log(`[Evolution] Connect no devolvió QR, eliminando instancia...`);
      await deleteInstance();
      await new Promise(r => setTimeout(r, 1500));
    }

    // Paso 3: Crear instancia nueva
    const result = await createInstance();
    if (result === 'connected') {
      await setWebhook(); // Asegurar webhook configurado
      socket.emit('whatsapp-status', 'connected');
    } else if (result) {
      socket.emit('whatsapp-qr', result);
    } else {
      // Paso 4: Último intento - connect después de crear
      await new Promise(r => setTimeout(r, 2000));
      const lastQr = await tryConnect();
      if (lastQr === 'connected') {
        await setWebhook();
        socket.emit('whatsapp-status', 'connected');
      } else if (lastQr) {
        socket.emit('whatsapp-qr', lastQr);
      } else {
        socket.emit('whatsapp-status', 'Error: No se pudo obtener QR después de crear instancia');
      }
    }
  } catch (err: any) {
    console.error(`[Evolution] Error en flujo principal:`, err.message);
    socket.emit('whatsapp-status', `Error: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════
//  FUNCIONES DE EVOLUTION API
// ═══════════════════════════════════════════════════

/** Verifica si la instancia existe consultando fetchInstances */
async function checkInstanceExists(): Promise<boolean> {
  try {
    const url = `${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${INSTANCE_NAME}`;
    console.log(`[Evolution] GET ${url}`);
    const res = await safeFetch(url, { headers: getHeaders() });
    const text = await res.text();
    console.log(`[Evolution] fetchInstances (${res.status}): ${text.substring(0, 300)}`);

    if (res.ok) {
      const data = JSON.parse(text);
      // Puede ser un array o un objeto
      if (Array.isArray(data)) {
        return data.some((inst: any) => inst.instance?.instanceName === INSTANCE_NAME || inst.name === INSTANCE_NAME);
      }
      if (data?.instance?.instanceName === INSTANCE_NAME || data?.name === INSTANCE_NAME) {
        return true;
      }
      // Si devuelve algo con contenido, la instancia existe
      if (text.length > 10 && res.ok) return true;
    }
    return false;
  } catch (e: any) {
    console.error(`[Evolution] Error en checkInstanceExists:`, e.message);
    return false;
  }
}

/** Intenta conectar y obtener QR. Retorna base64 del QR, 'connected', o null */
async function tryConnect(): Promise<string | null> {
  try {
    const url = `${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`;
    console.log(`[Evolution] GET ${url}`);
    const res = await safeFetch(url, { headers: getHeaders() });
    const text = await res.text();
    console.log(`[Evolution] connect (${res.status}): ${text.substring(0, 400)}`);

    if (!res.ok) return null;

    const data = JSON.parse(text);

    // Buscar QR en múltiples posibles ubicaciones (varía por versión)
    const qr = data?.base64
      || data?.qrcode?.base64
      || data?.data?.base64
      || data?.data?.qrcode?.base64
      || data?.code;

    if (qr && typeof qr === 'string' && qr.length > 50) {
      console.log(`[Evolution] ✅ QR obtenido (${qr.length} chars)`);
      return qr;
    }

    // Verificar si ya está conectado
    if (data?.instance?.state === 'open' || data?.state === 'open') {
      console.log(`[Evolution] ✅ Ya está conectado`);
      return 'connected';
    }

    console.log(`[Evolution] Connect OK pero sin QR reconocible`);
    return null;
  } catch (e: any) {
    console.error(`[Evolution] Error en tryConnect:`, e.message);
    return null;
  }
}

/** Elimina la instancia */
async function deleteInstance(): Promise<void> {
  try {
    const url = `${EVOLUTION_API_URL}/instance/delete/${INSTANCE_NAME}`;
    console.log(`[Evolution] DELETE ${url}`);
    const res = await safeFetch(url, { method: 'DELETE', headers: getHeaders() });
    const text = await res.text();
    console.log(`[Evolution] delete (${res.status}): ${text.substring(0, 200)}`);
  } catch (e: any) {
    console.error(`[Evolution] Error eliminando instancia:`, e.message);
  }
}

/** Crea una instancia nueva. Retorna QR base64, 'connected', o null */
async function createInstance(): Promise<string | null> {
  try {
    const url = `${EVOLUTION_API_URL}/instance/create`;

    // Payload mínimo compatible con Evolution v2.x
    const payload: any = {
      instanceName: INSTANCE_NAME,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    };

    // Agregar webhook solo si está configurado
    if (WEBHOOK_URL && WEBHOOK_URL !== '') {
      payload.webhook = {
        url: WEBHOOK_URL,
        byEvents: false,
        base64: true,
        events: [
          'QRCODE_UPDATED',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE',
        ],
      };
    }

    console.log(`[Evolution] POST ${url}`);
    console.log(`[Evolution] Payload:`, JSON.stringify(payload));

    const res = await safeFetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log(`[Evolution] create (${res.status}): ${text.substring(0, 500)}`);

    if (!res.ok) {
      console.error(`[Evolution] ❌ Falló creación: ${res.status}`);
      return null;
    }

    const data = JSON.parse(text);
    const qr = data?.qrcode?.base64
      || data?.base64
      || data?.data?.qrcode?.base64;

    if (qr && typeof qr === 'string' && qr.length > 50) {
      console.log(`[Evolution] ✅ QR obtenido al crear`);
      return qr;
    }

    if (data?.instance?.state === 'open') {
      return 'connected';
    }

    return null;
  } catch (e: any) {
    console.error(`[Evolution] Error creando instancia:`, e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════
//  CONFIGURAR WEBHOOK EN LA INSTANCIA
// ═══════════════════════════════════════════════════
async function setWebhook(): Promise<void> {
  try {
    const webhookPayload = {
      url: WEBHOOK_URL,
      webhook_by_events: false,
      webhook_base64: true,
      events: [
        'APPLICATION_STARTUP',
        'QRCODE_UPDATED',
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'SEND_MESSAGE',
        'CONNECTION_UPDATE',
      ],
    };

    console.log(`[Evolution] Configurando webhook: ${WEBHOOK_URL}`);

    // Intentar con POST /webhook/set (Evolution v2)
    const res = await safeFetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(webhookPayload),
    });

    const text = await res.text();
    console.log(`[Evolution] Webhook set (${res.status}): ${text.substring(0, 200)}`);

    if (!res.ok) {
      // Fallback: intentar con PUT /webhook/set
      const res2 = await safeFetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(webhookPayload),
      });
      const text2 = await res2.text();
      console.log(`[Evolution] Webhook set PUT (${res2.status}): ${text2.substring(0, 200)}`);
    }

    // Verificar webhook configurado
    try {
      const checkRes = await safeFetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
        headers: getHeaders(),
      });
      const checkText = await checkRes.text();
      console.log(`[Evolution] Webhook actual: ${checkText.substring(0, 300)}`);
    } catch {}

  } catch (e: any) {
    console.error(`[Evolution] Error configurando webhook:`, e.message);
  }
}

// ═══════════════════════════════════════════════════
//  ENVIAR MENSAJE
// ═══════════════════════════════════════════════════
export const sendEvolutionMessage = async (to: string, text: string) => {
  const number = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
  try {
    await safeFetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ number, options: { delay: 1200 }, text }), // Evolution v2 usa 'text' directamente
    });
  } catch (error: any) {
    console.error('[Evolution] Error enviando mensaje:', error.message);
  }
};

/** Enviar multimedia (imagen, video, audio, documento) */
export const sendEvolutionMedia = async (to: string, mediaBase64: string, caption?: string, fileName?: string) => {
  const number = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;

  // Determinar tipo de media del data URI
  const mimeMatch = mediaBase64.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const pureBase64 = mediaBase64.replace(/^data:[^;]+;base64,/, '');

  let endpoint = 'sendMedia';
  let payload: any = {
    number,
    options: { delay: 1200 },
    mediaMessage: {
      mediatype: 'document',
      caption: caption || '',
      media: `data:${mimeType};base64,${pureBase64}`,
      fileName: fileName || 'archivo',
    },
  };

  if (mimeType.startsWith('image/')) {
    payload.mediaMessage.mediatype = 'image';
  } else if (mimeType.startsWith('video/')) {
    payload.mediaMessage.mediatype = 'video';
  } else if (mimeType.startsWith('audio/')) {
    endpoint = 'sendWhatsAppAudio';
    payload = {
      number,
      options: { delay: 1200 },
      audioMessage: {
        audio: `data:${mimeType};base64,${pureBase64}`,
      },
    };
  }

  try {
    await safeFetch(`${EVOLUTION_API_URL}/message/${endpoint}/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    console.log(`[Evolution] ✅ Media enviado a ${number} (${mimeType})`);
  } catch (error: any) {
    console.error('[Evolution] Error enviando media:', error.message);
  }
};

// ═══════════════════════════════════════════════════
//  ENDPOINT DE DIAGNÓSTICO
// ═══════════════════════════════════════════════════
evolutionRouter.get('/test', async (_req, res) => {
  const results: any = {
    config: {
      url: EVOLUTION_API_URL,
      token: EVOLUTION_API_TOKEN ? `${EVOLUTION_API_TOKEN.substring(0, 8)}...` : '(vacío)',
      instance: INSTANCE_NAME,
      webhook: WEBHOOK_URL,
    },
    tests: {},
  };

  // Test 1: Root
  try {
    const r = await safeFetch(EVOLUTION_API_URL, { headers: getHeaders() });
    results.tests.root = { status: r.status, ok: r.ok, body: (await r.text()).substring(0, 200) };
  } catch (e: any) {
    results.tests.root = { error: e.message };
  }

  // Test 2: Fetch instances
  try {
    const r = await safeFetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, { headers: getHeaders() });
    results.tests.fetchInstances = { status: r.status, body: (await r.text()).substring(0, 500) };
  } catch (e: any) {
    results.tests.fetchInstances = { error: e.message };
  }

  // Test 3: Connect (obtener QR)
  try {
    const r = await safeFetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, { headers: getHeaders() });
    results.tests.connect = { status: r.status, body: (await r.text()).substring(0, 500) };
  } catch (e: any) {
    results.tests.connect = { error: e.message };
  }

  // Test 4: Connection state
  try {
    const r = await safeFetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, { headers: getHeaders() });
    results.tests.connectionState = { status: r.status, body: (await r.text()).substring(0, 300) };
  } catch (e: any) {
    results.tests.connectionState = { error: e.message };
  }

  // Test 5: Webhook configuration
  try {
    const r = await safeFetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, { headers: getHeaders() });
    results.tests.webhookConfig = { status: r.status, body: (await r.text()).substring(0, 500) };
  } catch (e: any) {
    results.tests.webhookConfig = { error: e.message };
  }

  results.webhookTarget = WEBHOOK_URL;

  res.json(results);
});

// ═══════════════════════════════════════════════════
//  FORZAR CONFIGURACIÓN DE WEBHOOK (manual)
// ═══════════════════════════════════════════════════
evolutionRouter.get('/setup-webhook', async (_req, res) => {
  await setWebhook();
  // Verificar resultado
  try {
    const r = await safeFetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, { headers: getHeaders() });
    const data = await r.text();
    res.json({ message: 'Webhook configurado', target: WEBHOOK_URL, current: JSON.parse(data) });
  } catch (e: any) {
    res.json({ message: 'Webhook configurado (no se pudo verificar)', target: WEBHOOK_URL, error: e.message });
  }
});

// Últimos webhooks recibidos (para debug)
const webhookLog: any[] = [];

// ═══════════════════════════════════════════════════
//  LOG DE WEBHOOKS RECIBIDOS
// ═══════════════════════════════════════════════════
evolutionRouter.get('/webhook-log', (_req, res) => {
  res.json({ total: webhookLog.length, last20: webhookLog.slice(-20) });
});

// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
//  WEBHOOK DE EVOLUTION API
// ═══════════════════════════════════════════════════
const handleWebhookEvent = async (req: any, res: any) => {
  const body = req.body;
  const event = body?.event || 'desconocido';
  console.log(`[Evolution Webhook] Evento: ${event}`);

  // Guardar en log para debug (mantener solo los últimos 50)
  webhookLog.push({
    time: new Date().toISOString(),
    event,
    data: body.data ? 'Presente' : 'Ausente',
    remoteJid: body.data?.message?.key?.remoteJid || body.data?.key?.remoteJid
  });
  if (webhookLog.length > 50) webhookLog.shift();

  if (!ioInstance) return res.sendStatus(200);

  try {
    // ─── QR Actualizado ───
    if (event === 'qrcode.updated') {
      const qr = body.data?.qrcode?.base64 || body.data?.base64;
      if (qr) {
        console.log(`[Evolution Webhook] QR actualizado → frontend`);
        ioInstance.emit('whatsapp-qr', qr);
      }
    }
    // ─── Estado de Conexión ───
    else if (event === 'connection.update') {
      const state = body.data?.state;
      console.log(`[Evolution Webhook] Conexión: ${state}`);
      if (state === 'open') {
        ioInstance.emit('whatsapp-status', 'connected');
        // Asegurar que el webhook esté configurado
        await setWebhook();
      } else if (state === 'close') {
        ioInstance.emit('whatsapp-status', 'disconnected');
      }
    }
    // ─── Mensajes Entrantes y Salientes ───
    else if (event === 'messages.upsert') {
      const data = body.data || {};
      
      // En Evolution v2, a veces la data es directamente el objeto con key, 
      // a veces es un array (data.messages), y a veces viene dentro de data.message
      let msg = data;
      if (data.key && data.message) {
        msg = data; // Es el formato esperado: { key: {}, message: {}, pushName: '' }
      } else if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        msg = data.messages[0];
      } else if (data.message && data.message.key) {
        msg = data.message;
      }

      if (!msg || !msg.key) {
        console.log(`[Evolution Webhook] Mensaje sin key, ignorando. Estructura:`, Object.keys(data));
        return res.sendStatus(200);
      }

      const fromMe = msg.key.fromMe === true;
      const remoteJid = msg.key.remoteJid;
      const id = msg.key.id;
      const pushName = msg.pushName || remoteJid?.split('@')[0] || 'Desconocido';
      const messageContent = msg.message || {};

      // Extraer texto del mensaje
      let text = messageContent.conversation
        || messageContent.extendedTextMessage?.text
        || messageContent.imageMessage?.caption
        || messageContent.videoMessage?.caption
        || messageContent.documentMessage?.fileName
        || '';

      // Detectar tipo de multimedia
      let mediaUrl: string | undefined;
      let mimeType: string | undefined;
      let mediaType: string = 'text';

      if (messageContent.imageMessage) {
        mediaType = 'image';
        mimeType = messageContent.imageMessage.mimetype || 'image/jpeg';
        if (!text) text = '📷 Imagen';
      } else if (messageContent.videoMessage) {
        mediaType = 'video';
        mimeType = messageContent.videoMessage.mimetype || 'video/mp4';
        if (!text) text = '🎬 Video';
      } else if (messageContent.audioMessage) {
        mediaType = 'audio';
        mimeType = messageContent.audioMessage.mimetype || 'audio/ogg';
        text = messageContent.audioMessage.ptt ? '🎤 Mensaje de voz' : '🎵 Audio';
      } else if (messageContent.documentMessage) {
        mediaType = 'document';
        mimeType = messageContent.documentMessage.mimetype || 'application/octet-stream';
        if (!text) text = `📄 ${messageContent.documentMessage.fileName || 'Documento'}`;
      } else if (messageContent.stickerMessage) {
        mediaType = 'sticker';
        mimeType = 'image/webp';
        text = '🏷️ Sticker';
      } else if (messageContent.contactMessage || messageContent.contactsArrayMessage) {
        text = '👤 Contacto compartido';
      } else if (messageContent.locationMessage) {
        text = `📍 Ubicación: ${messageContent.locationMessage.degreesLatitude}, ${messageContent.locationMessage.degreesLongitude}`;
      }

      if (!text) text = '[Mensaje]';

      // Intentar descargar multimedia desde Evolution API
      if (['image', 'video', 'audio', 'document', 'sticker'].includes(mediaType) && msg.key.id) {
        try {
          const mediaRes = await safeFetch(
            `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${INSTANCE_NAME}`,
            {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({ message: msg }),
            }
          );
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            const base64 = mediaData?.base64 || mediaData?.data?.base64;
            if (base64) {
              mediaUrl = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
            }
          }
        } catch (mediaErr: any) {
          console.error('[Evolution] Error descargando media:', mediaErr.message);
        }
      }

      // Determinar chatId (siempre usar remoteJid para agrupar)
      const chatId = fromMe ? remoteJid : remoteJid;
      const displayName = fromMe ? 'Tú' : pushName;

      console.log(`[Evolution Webhook] ${fromMe ? '→' : '←'} ${displayName}: ${text.substring(0, 60)} ${mediaType !== 'text' ? `[${mediaType}]` : ''}`);

      // Emitir al frontend
      ioInstance.emit('whatsapp-message', {
        id,
        from: chatId,
        name: fromMe ? 'Tú' : pushName,
        text,
        media: mediaUrl,
        mimeType,
        fromMe,
        timestamp: msg.messageTimestamp
          ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
          : new Date().toISOString(),
      });

      // Auto-registrar como lead (solo mensajes entrantes)
      let isBotActive = false;
      if (!fromMe && remoteJid && !remoteJid.includes('@g.us') && !remoteJid.includes('@broadcast')) {
        try {
          const phone = remoteJid.split('@')[0];
          const existRes = await pool.query('SELECT id, bot_active FROM leads WHERE phone = $1', [phone]);
          if (existRes.rowCount === 0) {
            await pool.query(
              `INSERT INTO leads (name, phone, score, status, bot_active) VALUES ($1, $2, '50%', 'Nuevo', true)`,
              [pushName, phone]
            );
            isBotActive = true;
            console.log(`[Evolution] ✅ Lead registrado: ${pushName} (${phone}) con bot activado`);
            ioInstance.emit('new-lead', { name: pushName, phone });
          } else {
            isBotActive = existRes.rows[0].bot_active;
          }
        } catch (dbErr: any) {
          console.error('[Evolution] Error registrando lead:', dbErr.message);
        }
      }

      // Respuesta IA con Debounce de 12 segundos (solo si bot_active es true)
      if (!fromMe && remoteJid && !remoteJid.includes('@g.us') && !remoteJid.includes('@broadcast')) {
        if (isBotActive) {
          if (!messageQueue[remoteJid]) {
            messageQueue[remoteJid] = { texts: [], timer: null as any };
          }

          // Agregamos el texto al bloque de mensajes
          messageQueue[remoteJid].texts.push(text);

          // Limpiamos el temporizador anterior si el usuario mandó otro mensaje rápido
          if (messageQueue[remoteJid].timer) {
            clearTimeout(messageQueue[remoteJid].timer);
          }

          // Configuramos un nuevo temporizador de 12 segundos (12000 ms)
          messageQueue[remoteJid].timer = setTimeout(async () => {
            const combinedText = messageQueue[remoteJid].texts.join('\n');
            delete messageQueue[remoteJid]; // Limpiar cola

            try {
              console.log(`[Evolution] 🤖 Generando respuesta IA para ${remoteJid} (texto combinado)`);
              const aiReply = await generateAIResponse(remoteJid, combinedText);
              if (aiReply) {
                await sendEvolutionMessage(remoteJid, aiReply);
              }
            } catch (aiErr: any) {
              console.error('[Evolution] Error IA:', aiErr.message);
            }
          }, 12000);
        } else {
          console.log(`[Evolution] ⏸️ Bot apagado para ${remoteJid}, se ignora el mensaje.`);
        }
      }
    }
    // ─── Mensaje enviado exitosamente ───
    else if (event === 'send.message') {
      const data = body.data || {};
      let msg = data;
      if (data.key && data.message) msg = data;
      else if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) msg = data.messages[0];
      else if (data.message && data.message.key) msg = data.message;
      if (msg?.key) {
        const remoteJid = msg.key.remoteJid;
        const text = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || '[Mensaje enviado]';

        ioInstance.emit('whatsapp-message', {
          id: msg.key.id,
          from: remoteJid,
          name: 'Tú',
          text,
          fromMe: true,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err: any) {
    console.error('[Evolution Webhook] Error:', err.message);
  }

  res.sendStatus(200);
};

// Rutas duales para el Webhook por si falta el /webhook final
evolutionRouter.post('/', handleWebhookEvent);
evolutionRouter.post('/webhook', handleWebhookEvent);
// ═══════════════════════════════════════════════════
//  ENDPOINT DE HISTORIAL DE MENSAJES
// ═══════════════════════════════════════════════════
evolutionRouter.get('/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await pool.query(
      `SELECT id, text, from_me, timestamp, media_url, media_type 
       FROM evolution_messages 
       WHERE chat_id = $1 
       ORDER BY timestamp ASC`,
      [chatId]
    );

    const messages = result.rows.map(row => ({
      id: row.id,
      fromMe: row.from_me,
      text: row.text,
      media: row.media_url,
      mimeType: row.media_type,
      time: new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: row.timestamp
    }));

    res.json(messages);
  } catch (err: any) {
    console.error('[Evolution] Error obteniendo historial:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { evolutionRouter };
