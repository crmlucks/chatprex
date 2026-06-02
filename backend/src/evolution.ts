import { Server } from 'socket.io';
import express from 'express';
import { generateAIResponse, appendMessageToHistory } from './ai';
import { transcribeAudio } from './voiceBot';
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

    socket.on('send-message', async (data: { to: string; text: string; media?: string; mimeType?: string; fileName?: string }) => {
      try {
        console.log(`[Socket] ═══ SEND-MESSAGE RECIBIDO (Evolution) ═══`);
        console.log(`[Socket] To: ${data.to}`);
        console.log(`[Socket] Text: ${data.text?.substring(0, 80)}`);
        console.log(`[Socket] Media: ${data.media ? `SI (${data.media.substring(0, 30)}... ${data.media.length} chars)` : 'NO'}`);
        console.log(`[Socket] FileName: ${data.fileName || '(ninguno)'}`);
        console.log(`[Socket] MimeType: ${data.mimeType || '(ninguno)'}`);

        // 1. Apagar el bot automáticamente cuando el humano interviene
        try {
          const phone = data.to.split('@')[0].split(':')[0];
          await pool.query('UPDATE leads SET bot_active = false WHERE phone = $1', [phone]);
          console.log(`[Bot] ⏸️ Bot desactivado para ${phone}`);

          // 2. Añadir el mensaje manual del humano al historial de la IA
          const remoteJid = data.to.includes('@') ? data.to : `${data.to}@s.whatsapp.net`;
          if (data.text) {
            appendMessageToHistory(remoteJid, 'assistant', data.text);
          }
        } catch (dbErr: any) {
          console.error('[Evolution] Error actualizando estado de bot:', dbErr.message);
        }

        // 3. Enviar a través de Evolution API
        if (data.media) {
          console.log(`[Socket] → Enviando MULTIMEDIA...`);
          await sendEvolutionMedia(data.to, data.media, data.text, data.fileName);
        } else if (data.text) {
          console.log(`[Socket] → Enviando TEXTO...`);
          await sendEvolutionMessage(data.to, data.text);
        }

        // 4. Guardar proactivamente en la base de datos (con media_url)
        try {
          const msgId = `manual-${Date.now()}`;
          const cleanTo = data.to.includes('@') ? data.to : `${data.to}@s.whatsapp.net`;
          await pool.query(
            `INSERT INTO evolution_messages (id, chat_id, text, from_me, timestamp, media_url, media_type)
             VALUES ($1, $2, $3, true, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [
              msgId, 
              cleanTo, 
              data.text || (data.media ? '[Archivo multimedia]' : ''), 
              new Date().toISOString(), 
              data.media || null, 
              data.mimeType || null
            ]
          );
          console.log(`[Evolution] ✅ Mensaje guardado en BD con ID: ${msgId}`);
        } catch (dbErr: any) {
          console.error('[Evolution] Error guardando mensaje manual en BD:', dbErr.message);
        }
        
        console.log(`[Socket] ═══ SEND-MESSAGE COMPLETADO ═══`);
      } catch (err: any) {
        console.error('[Evolution] Error enviando mensaje manual:', err.message);
        socket.emit('send-message-error', { error: err.message });
      }
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
      const res2 = await safeFetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(webhookPayload),
      });
      const text2 = await res2.text();
      console.log(`[Evolution] Webhook set PUT (${res2.status}): ${text2.substring(0, 200)}`);
    }

    try {
      const checkRes = await safeFetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, { headers: getHeaders() });
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
  const cleanNumber = to.replace('@s.whatsapp.net', '').replace('@lid', '').split(':')[0];
  const jidNumber = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  
  console.log(`[Evolution] sendText → clean: ${cleanNumber}, jid: ${jidNumber}`);
  
  try {
    // Intento 1: número limpio + text directo (Evolution v2)
    const res = await safeFetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ number: cleanNumber, options: { delay: 1200 }, text }),
    });
    const resText = await res.text();
    
    if (res.ok) {
      console.log(`[Evolution] ✅ Mensaje enviado a ${cleanNumber}`);
      return;
    }
    console.error(`[Evolution] intento 1 falló (${res.status}): ${resText.substring(0, 300)}`);
    
    // Intento 2: con JID completo
    const res2 = await safeFetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ number: jidNumber, options: { delay: 1200 }, text }),
    });
    const resText2 = await res2.text();
    
    if (res2.ok) {
      console.log(`[Evolution] ✅ Mensaje enviado a ${jidNumber} (JID)`);
      return;
    }
    console.error(`[Evolution] intento 2 falló (${res2.status}): ${resText2.substring(0, 300)}`);
    
    // Intento 3: formato textMessage (Evolution v1)
    const res3 = await safeFetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ number: cleanNumber, options: { delay: 1200 }, textMessage: { text } }),
    });
    const resText3 = await res3.text();
    
    if (res3.ok) {
      console.log(`[Evolution] ✅ Mensaje enviado (v1 textMessage)`);
    } else {
      console.error(`[Evolution] ❌ Todos los intentos fallaron. Último (${res3.status}): ${resText3.substring(0, 300)}`);
    }
  } catch (error: any) {
    console.error('[Evolution] Error enviando mensaje:', error.message);
  }
};

/** Enviar multimedia (imagen, video, audio, documento) */
export const sendEvolutionMedia = async (to: string, mediaBase64: string, caption?: string, fileName?: string) => {
  const number = to.replace('@s.whatsapp.net', '').replace('@lid', '').split(':')[0];

  // Determinar tipo de media y mimetype del data URI o URL
  let mimeType = 'application/octet-stream';
  let pureMedia = mediaBase64;
  let isUrl = mediaBase64.startsWith('http');

  if (isUrl) {
    const ext = mediaBase64.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) mimeType = 'image/jpeg';
    else if (['mp4', 'mov'].includes(ext)) mimeType = 'video/mp4';
    else mimeType = 'image/jpeg'; // fallback para URLs de Cloudinary/S3 sin extensión clara
  } else {
    const mimeMatch = mediaBase64.match(/^data:([^;]+);base64,/);
    mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    pureMedia = mediaBase64.replace(/^data:[^;]+;base64,/, '');
  }

  let mediatype = 'document';
  if (mimeType.startsWith('image/')) mediatype = 'image';
  else if (mimeType.startsWith('video/')) mediatype = 'video';
  else if (mimeType.startsWith('audio/')) mediatype = 'audio';

  console.log(`[Evolution] Preparando envío de ${mediatype} (${mimeType}) a ${number}`);

  // Intentar con formato Estándar V2 (Plano) - Es el más compatible actualmente
  const v2Payload = {
    number,
    mediatype: mediatype,
    mimetype: mimeType,
    caption: caption || '',
    media: pureMedia,
    fileName: fileName || (mediatype === 'image' ? 'imagen.jpg' : mediatype === 'video' ? 'video.mp4' : 'archivo'),
    options: { delay: 1200 }
  };

  try {
    console.log(`[Evolution] Intento 1: Formato V2 Plano...`);
    const res = await safeFetch(`${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(v2Payload),
    });
    
    const resText = await res.text();
    if (res.ok) {
      console.log(`[Evolution] ✅ Media enviado exitosamente (V2)`);
      return;
    }
    console.error(`[Evolution] Intento 1 falló (${res.status}): ${resText.substring(0, 200)}`);

    // Intento 2: Formato V1 / Legacy (mediaMessage)
    const v1Payload = {
      number,
      options: { delay: 1200 },
      mediaMessage: {
        mediatype: mediatype,
        caption: caption || '',
        media: pureMedia,
        fileName: v2Payload.fileName
      }
    };

    console.log(`[Evolution] Intento 2: Formato V1 (mediaMessage)...`);
    const res2 = await safeFetch(`${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(v1Payload),
    });

    if (res2.ok) {
      console.log(`[Evolution] ✅ Media enviado exitosamente (V1)`);
      return;
    }
    const resText2 = await res2.text();
    console.error(`[Evolution] Intento 2 falló (${res2.status}): ${resText2.substring(0, 200)}`);

    // Intento 3: Si es audio, probar el endpoint específico
    if (mediatype === 'audio') {
      console.log(`[Evolution] Intento 3: Endpoint específico de audio...`);
      const resAudio = await safeFetch(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          number,
          audio: pureBase64,
          options: { delay: 1200 }
        }),
      });
      if (resAudio.ok) {
        console.log(`[Evolution] ✅ Audio enviado exitosamente (endpoint audio)`);
        return;
      }
    }

    throw new Error(`No se pudo enviar el archivo multimedia después de varios intentos.`);
  } catch (error: any) {
    console.error('[Evolution] Error crítico enviando multimedia:', error.message);
    throw error;
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

      // Restringir entrada de grupos de WhatsApp y estados (broadcast)
      if (remoteJid && (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast') || remoteJid === 'status@broadcast')) {
        return res.sendStatus(200);
      }

      const pushName = msg.pushName || remoteJid?.split('@')[0] || 'Desconocido';
      const messageContent = msg.message || {};

      // ─── OBTENER CONFIGURACIÓN DE IA (MULTI-BOT) ───
      let aiConfig: any = { activation_keywords: 'info,precio,quiero,asesor,comprar', voice_to_text: true, id: 1 };
      let allBots: any[] = [];
      try {
        const configRes = await pool.query('SELECT id, api_key, voice_to_text, activation_keywords, humanized_split, message_grouping FROM ai_config ORDER BY id ASC');
        if (configRes.rowCount > 0) {
          allBots = configRes.rows;
          aiConfig = { ...aiConfig, ...configRes.rows[0] }; // Por defecto el primer bot
        }
      } catch (err) {
        console.error('[Evolution] Error obteniendo config de IA:', err);
      }

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
              
              // Si es un mensaje de voz/audio, intentamos transcribirlo
              if (mediaType === 'audio' && aiConfig.voice_to_text !== false && aiConfig.api_key) {
                try {
                  const pureBase64 = base64.replace(/^data:[^;]+;base64,/, '');
                  const audioBuffer = Buffer.from(pureBase64, 'base64');
                  const transcription = await transcribeAudio(audioBuffer, mimeType || 'audio/ogg', aiConfig.api_key);
                  if (transcription) {
                    text = transcription; // Reemplazamos "🎤 Mensaje de voz" por el texto transcrito
                    console.log(`[Evolution Webhook] Audio transcrito: ${text}`);
                  }
                } catch (audioErr: any) {
                  console.error('[Evolution] Error transcribiendo audio:', audioErr.message);
                }
              }
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

      const msgTimestamp = msg.messageTimestamp
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      // ═══ GUARDAR EN BASE DE DATOS ═══
      try {
        await pool.query(
          `INSERT INTO evolution_messages (id, chat_id, text, from_me, timestamp, media_url, media_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [id, chatId, text, fromMe, msgTimestamp, mediaUrl || null, mimeType || null]
        );
      } catch (dbErr: any) {
        console.error('[Evolution] Error guardando mensaje en BD:', dbErr.message);
      }

      // Emitir al frontend
      ioInstance.emit('whatsapp-message', {
        id,
        from: chatId,
        name: fromMe ? 'Tú' : pushName,
        text,
        media: mediaUrl,
        mimeType,
        fromMe,
        timestamp: msgTimestamp,
      });

      // Configuración de palabras clave Multi-Bot
      const textLower = text.toLowerCase();
      let matchedBotId = 1;
      let containsKeyword = false;

      // Iterar por todos los bots para encontrar cuál coincide con las palabras clave del mensaje
      for (const bot of allBots) {
        const keywordsStr = bot.activation_keywords || 'info,precio,quiero,asesor,comprar';
        const keywords = keywordsStr.split(',').map((k: string) => k.trim().toLowerCase()).filter((k: string) => k.length > 0);
        if (keywords.length > 0 && keywords.some((kw: string) => textLower.includes(kw))) {
          matchedBotId = bot.id;
          containsKeyword = true;
          // Actualizamos aiConfig para que use la configuración de este bot específico para este mensaje
          aiConfig = { ...aiConfig, ...bot };
          break;
        }
      }

      // Auto-registrar como lead (solo mensajes entrantes, no grupos ni broadcast)
      let isBotActive = false;
      if (!fromMe && remoteJid && !remoteJid.includes('@g.us') && !remoteJid.includes('@broadcast')) {
        try {
          // Extraer identificador del contacto (funciona con @s.whatsapp.net y @lid)
          const phone = remoteJid.split('@')[0].split(':')[0];
          console.log(`[Evolution] Buscando lead con phone: ${phone}`);
          const existRes = await pool.query('SELECT id, bot_active, bot_id FROM leads WHERE phone = $1', [phone]);
          if (existRes.rowCount === 0) {
            // Nuevo lead: Solo activar bot si el mensaje contiene una palabra clave de activación
            isBotActive = containsKeyword;

            let assignedAdvisorId = null;
            try {
              const advisorRes = await pool.query(`
                SELECT id FROM users 
                WHERE status = 'activo' AND auto_assign = true 
                ORDER BY last_assigned_at ASC NULLS FIRST LIMIT 1
              `);
              if (advisorRes.rowCount > 0) {
                assignedAdvisorId = advisorRes.rows[0].id;
                await pool.query('UPDATE users SET last_assigned_at = NOW() WHERE id = $1', [assignedAdvisorId]);
              }
            } catch (err) {
              console.error('[Evolution] Error en auto asignación:', err);
            }

            await pool.query(
              `INSERT INTO leads (name, phone, score, status, bot_active, bot_id, advisor_id) VALUES ($1, $2, '50%', 'Nuevo', $3, $4, $5)`,
              [pushName, phone, isBotActive, matchedBotId, assignedAdvisorId]
            );
            console.log(`[Evolution] ✅ Lead registrado: ${pushName} (${phone}) - Bot: ${isBotActive ? 'ACTIVO (keyword match)' : 'INACTIVO (sin keyword)'} - Bot ID: ${matchedBotId}`);
            ioInstance.emit('new-lead', { name: pushName, phone });
          } else {
            isBotActive = existRes.rows[0].bot_active;
            const currentBotId = existRes.rows[0].bot_id || 1;
            
            // Si el bot estaba apagado pero el usuario mandó una palabra clave, despertarlo y reasignar al bot que hizo match
            if (!isBotActive && containsKeyword) {
              isBotActive = true;
              await pool.query('UPDATE leads SET bot_active = true, bot_id = $1 WHERE phone = $2', [matchedBotId, phone]);
              console.log(`[Evolution] 🤖 Bot DESPERTADO por palabra clave para: ${phone} (Bot ID: ${matchedBotId})`);
            } else {
              // Si ya está activo, usamos la configuración del bot que tiene asignado este lead
              if (currentBotId !== matchedBotId) {
                const assignedBot = allBots.find(b => b.id === currentBotId);
                if (assignedBot) {
                  aiConfig = { ...aiConfig, ...assignedBot };
                }
              }
              console.log(`[Evolution] Lead existente: ${phone}, bot_active: ${isBotActive}`);
            }
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
                let mediaUrlsToSend: string[] = [];
                let finalAiReply = aiReply;
                
                // Extraer etiquetas [MEDIA:url1|url2]
                const mediaMatch = finalAiReply.match(/\[MEDIA:([^\]]+)\]/);
                if (mediaMatch) {
                  mediaUrlsToSend = mediaMatch[1].split('|').map(u => u.trim()).filter(u => u.startsWith('http'));
                  finalAiReply = finalAiReply.replace(mediaMatch[0], '').trim();
                }

                let messagesToSend = [finalAiReply];
                if (aiConfig.humanized_split !== false && finalAiReply.length > 250) {
                  // Separar por párrafos reales (doble salto de línea) para no romper listas numeradas
                  let parts = finalAiReply.split(/\n\s*\n/).filter(p => p.trim().length > 0);
                  
                  // Si es un solo párrafo grande, separar por oraciones de forma más flexible
                  if (parts.length === 1) {
                    const sentenceRegex = /([^.?!]+[.?!]+)/g;
                    const matches = finalAiReply.match(sentenceRegex);
                    if (matches && matches.length > 1) {
                      parts = matches.map(s => s.trim());
                    } else {
                      // Fallback extremo si no hay puntuación: cortar a la mitad
                      const mid = Math.floor(finalAiReply.length / 2);
                      const spaceIdx = finalAiReply.indexOf(' ', mid);
                      if (spaceIdx > 0) {
                        parts = [finalAiReply.slice(0, spaceIdx).trim(), finalAiReply.slice(spaceIdx).trim()];
                      }
                    }
                  }
                  
                  if (parts.length > 4) {
                    messagesToSend = [
                      parts[0],
                      parts.slice(1, parts.length - 2).join('\n\n'),
                      parts[parts.length - 2],
                      parts[parts.length - 1]
                    ];
                  } else if (parts.length > 1) {
                    messagesToSend = parts;
                  }
                }

                // Enviar fotos/videos primero
                for (const url of mediaUrlsToSend) {
                  await sendEvolutionMedia(remoteJid, url, '');
                  await new Promise(r => setTimeout(r, 1500));
                  
                  // Emitir y guardar que se envió un archivo multimedia
                  ioInstance.emit('whatsapp-message', {
                    id: `ai-media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    from: remoteJid,
                    name: 'ChatPrex Bot',
                    text: '[Archivo Multimedia Enviado]',
                    media: url,
                    fromMe: true,
                    timestamp: new Date().toISOString(),
                  });
                }

                for (let i = 0; i < messagesToSend.length; i++) {
                  if (messagesToSend[i].trim().length > 0) {
                    const aiText = messagesToSend[i].trim();
                    await sendEvolutionMessage(remoteJid, aiText);
                    
                    // Emitir al frontend inmediatamente
                    ioInstance.emit('whatsapp-message', {
                      id: `ai-${Date.now()}-${i}`,
                      from: remoteJid,
                      name: 'ChatPrex Bot',
                      text: aiText,
                      fromMe: true,
                      timestamp: new Date().toISOString(),
                    });
                    
                    // Guardar en BD por si el webhook no lo reporta
                    try {
                      await pool.query(
                        `INSERT INTO evolution_messages (id, chat_id, text, from_me, timestamp)
                         VALUES ($1, $2, $3, true, $4)
                         ON CONFLICT (id) DO NOTHING`,
                        [`ai-${Date.now()}-${i}`, remoteJid, aiText, new Date().toISOString()]
                      );
                    } catch (e) {}

                    if (i < messagesToSend.length - 1) {
                      await new Promise(r => setTimeout(r, 5000));
                    }
                  }
                }
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
        const msgId = msg.key.id;
        const text = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || '[Mensaje enviado]';

        const sentTimestamp = new Date().toISOString();

        // Guardar mensaje enviado en BD
        try {
          await pool.query(
            `INSERT INTO evolution_messages (id, chat_id, text, from_me, timestamp)
             VALUES ($1, $2, $3, true, $4)
             ON CONFLICT (id) DO NOTHING`,
            [msgId, remoteJid, text, sentTimestamp]
          );
        } catch (dbErr: any) {
          console.error('[Evolution] Error guardando msg enviado en BD:', dbErr.message);
        }

        ioInstance.emit('whatsapp-message', {
          id: msgId,
          from: remoteJid,
          name: 'Tú',
          text,
          fromMe: true,
          timestamp: sentTimestamp,
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

// ═══════════════════════════════════════════════════
//  ENDPOINT DE LISTA DE CHATS
// ═══════════════════════════════════════════════════
evolutionRouter.get('/chats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.chat_id as id,
        COALESCE(l.name, SPLIT_PART(m.chat_id, '@', 1)) as name,
        COALESCE(l.bot_active, false) as bot_active,
        l.id as lead_id,
        m.text as last_message,
        m.timestamp as time
      FROM (
        SELECT chat_id, text, timestamp,
               ROW_NUMBER() OVER(PARTITION BY chat_id ORDER BY timestamp DESC) as rn
        FROM evolution_messages
      ) m
      LEFT JOIN leads l ON l.phone = SPLIT_PART(m.chat_id, '@', 1)
      WHERE m.rn = 1 AND m.chat_id NOT LIKE '%@g.us' AND m.chat_id NOT LIKE '%@broadcast'
      ORDER BY m.timestamp DESC
    `);

    const chats = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      botActive: row.bot_active,
      leadId: row.lead_id,
      lastMessage: row.last_message || '[Media]',
      time: new Date(row.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: row.time,
      unread: 0,
      status: 'Leído',
      messages: []
    }));

    res.json(chats);
  } catch (err: any) {
    console.error('[Evolution] Error obteniendo chats:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { evolutionRouter };
