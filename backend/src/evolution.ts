import { Server } from 'socket.io';
import express from 'express';
import { generateAIResponse } from './ai';
import pool from './db';

// Permitir certificados self-signed dentro de Docker/Coolify
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const evolutionRouter = express.Router();

// Limpiar URL: quitar trailing slash
const rawUrl = (process.env.EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
const EVOLUTION_API_URL = rawUrl;
const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN || '';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'ChatPrex';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://api.chatprex.com/api/webhook/evolution/webhook';

let ioInstance: Server | null = null;

console.log(`[Evolution] Config loaded:`);
console.log(`  URL: ${EVOLUTION_API_URL}`);
console.log(`  Token: ${EVOLUTION_API_TOKEN ? EVOLUTION_API_TOKEN.substring(0, 6) + '...' : '(vacío)'}`);
console.log(`  Instance: ${INSTANCE_NAME}`);
console.log(`  Webhook: ${WEBHOOK_URL}`);

const getHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_API_TOKEN,
});

/**
 * Wrapper de fetch con timeout para evitar cuelgues.
 */
async function safeFetch(url: string, options: any = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15000), // 15 segundos timeout
  });
}

// ─── Inicialización Socket ───
export const initEvolution = (io: Server) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Evolution] Socket conectado, verificando estado...`);
    checkEvolutionStatus(socket);

    socket.on('request-evolution-qr', () => {
      console.log(`[Evolution] QR solicitado manualmente`);
      fetchEvolutionQR(socket);
    });
  });
};

// ─── Verificar estado de conexión ───
export const checkEvolutionStatus = async (socket: any) => {
  const url = `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`;
  console.log(`[Evolution] GET ${url}`);

  try {
    const res = await safeFetch(url, { headers: getHeaders() });
    const text = await res.text();
    console.log(`[Evolution] Status response (${res.status}): ${text.substring(0, 200)}`);

    if (res.ok) {
      try {
        const data = JSON.parse(text);
        if (data?.instance?.state === 'open') {
          socket.emit('whatsapp-status', 'connected');
          return;
        }
      } catch {}
    }

    // Si no está conectado o no existe, pedir QR
    await fetchEvolutionQR(socket);
  } catch (error: any) {
    console.error(`[Evolution] FALLO de red al verificar status:`, error.message);
    // Intentar creando la instancia directamente
    try {
      await fetchEvolutionQR(socket);
    } catch (e2: any) {
      socket.emit('whatsapp-status', `Error Red: ${error.message}`);
    }
  }
};

// ─── Obtener QR (conectar o crear instancia) ───
export const fetchEvolutionQR = async (socket: any) => {
  // Paso 1: Intentar /instance/connect
  try {
    const connectUrl = `${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`;
    console.log(`[Evolution] Intentando conectar: GET ${connectUrl}`);

    const connectRes = await safeFetch(connectUrl, { headers: getHeaders() });
    const connectText = await connectRes.text();
    console.log(`[Evolution] Connect response (${connectRes.status}): ${connectText.substring(0, 300)}`);

    if (connectRes.ok) {
      try {
        const connectData = JSON.parse(connectText);
        // Evolution v2 devuelve el QR en distintos campos según la versión
        const qrBase64 = connectData?.base64
          || connectData?.qrcode?.base64
          || connectData?.data?.base64
          || connectData?.data?.qrcode?.base64;

        if (qrBase64) {
          console.log(`[Evolution] ✅ QR obtenido exitosamente (${qrBase64.length} chars)`);
          socket.emit('whatsapp-qr', qrBase64);
          return;
        }

        // Tal vez ya está conectado
        if (connectData?.instance?.state === 'open') {
          socket.emit('whatsapp-status', 'connected');
          return;
        }
      } catch {}
    }
  } catch (err: any) {
    console.log(`[Evolution] Connect falló: ${err.message}`);
  }

  // Paso 2: Si connect falló, crear instancia nueva
  try {
    const createUrl = `${EVOLUTION_API_URL}/instance/create`;
    const payload = {
      instanceName: INSTANCE_NAME,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: WEBHOOK_URL,
      webhook_by_events: false,
      webhook_base64: true,
      webhook_events: [
        'APPLICATION_STARTUP',
        'QRCODE_UPDATED',
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'SEND_MESSAGE',
        'CONNECTION_UPDATE',
      ],
    };

    console.log(`[Evolution] Creando instancia: POST ${createUrl}`);
    console.log(`[Evolution] Payload:`, JSON.stringify(payload));

    const res = await safeFetch(createUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const resText = await res.text();
    console.log(`[Evolution] Create response (${res.status}): ${resText.substring(0, 500)}`);

    if (res.ok) {
      try {
        const data = JSON.parse(resText);
        const qrBase64 = data?.qrcode?.base64 || data?.base64 || data?.data?.qrcode?.base64;

        if (qrBase64) {
          console.log(`[Evolution] ✅ QR obtenido al crear instancia`);
          socket.emit('whatsapp-qr', qrBase64);
          return;
        }

        if (data?.instance?.state === 'open') {
          socket.emit('whatsapp-status', 'connected');
          return;
        }

        // Fallback: esperar 2s y pedir connect de nuevo
        console.log(`[Evolution] Instancia creada pero sin QR, reintentando connect...`);
        await new Promise((r) => setTimeout(r, 2000));

        const fbRes = await safeFetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
          headers: getHeaders(),
        });
        const fbText = await fbRes.text();
        console.log(`[Evolution] Retry connect (${fbRes.status}): ${fbText.substring(0, 300)}`);

        if (fbRes.ok) {
          try {
            const fbData = JSON.parse(fbText);
            const qr = fbData?.base64 || fbData?.qrcode?.base64;
            if (qr) {
              socket.emit('whatsapp-qr', qr);
              return;
            }
          } catch {}
        }
      } catch {}
    }

    // Si la instancia ya existe (409), intentar connect
    if (res.status === 409) {
      console.log(`[Evolution] Instancia ya existe, intentando connect...`);
      const retryRes = await safeFetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: getHeaders(),
      });
      const retryText = await retryRes.text();
      console.log(`[Evolution] Retry after 409 (${retryRes.status}): ${retryText.substring(0, 300)}`);
      if (retryRes.ok) {
        try {
          const rd = JSON.parse(retryText);
          const qr = rd?.base64 || rd?.qrcode?.base64;
          if (qr) {
            socket.emit('whatsapp-qr', qr);
            return;
          }
        } catch {}
      }
    }

    socket.emit('whatsapp-status', `Error Creación (${res.status}): ${resText.substring(0, 80)}`);
  } catch (error: any) {
    console.error(`[Evolution] FALLO completo:`, error.message);
    socket.emit('whatsapp-status', `Error Red: ${error.message}`);
  }
};

// ─── Enviar mensaje ───
export const sendEvolutionMessage = async (to: string, text: string) => {
  const number = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
  try {
    await safeFetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ number, options: { delay: 1200 }, textMessage: { text } }),
    });
  } catch (error: any) {
    console.error('[Evolution] Error enviando mensaje:', error.message);
  }
};

// ─── Endpoint de diagnóstico (público) ───
evolutionRouter.get('/test', async (_req, res) => {
  const results: any = {
    config: {
      url: EVOLUTION_API_URL,
      token: EVOLUTION_API_TOKEN ? `${EVOLUTION_API_TOKEN.substring(0, 6)}...` : '(vacío)',
      instance: INSTANCE_NAME,
      webhook: WEBHOOK_URL,
    },
    tests: {},
  };

  // Test 1: Alcanzar Evolution API raíz
  try {
    const r = await safeFetch(EVOLUTION_API_URL, { headers: getHeaders() });
    results.tests.root = { status: r.status, ok: r.ok, body: (await r.text()).substring(0, 200) };
  } catch (e: any) {
    results.tests.root = { error: e.message };
  }

  // Test 2: Verificar estado de instancia
  try {
    const r = await safeFetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      headers: getHeaders(),
    });
    results.tests.connectionState = { status: r.status, body: (await r.text()).substring(0, 200) };
  } catch (e: any) {
    results.tests.connectionState = { error: e.message };
  }

  // Test 3: Listar instancias
  try {
    const r = await safeFetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: getHeaders(),
    });
    results.tests.fetchInstances = { status: r.status, body: (await r.text()).substring(0, 500) };
  } catch (e: any) {
    results.tests.fetchInstances = { error: e.message };
  }

  res.json(results);
});

// ─── Webhook de Evolution API ───
evolutionRouter.post('/webhook', async (req, res) => {
  const body = req.body;
  console.log(`[Evolution Webhook] Evento recibido: ${body?.event || 'desconocido'}`);

  if (!ioInstance) return res.sendStatus(200);

  try {
    // QR actualizado
    if (body.event === 'qrcode.updated') {
      const qr = body.data?.qrcode?.base64 || body.data?.base64;
      if (qr) {
        console.log(`[Evolution Webhook] QR actualizado, emitiendo a frontend`);
        ioInstance.emit('whatsapp-qr', qr);
      }
    }
    // Estado de conexión
    else if (body.event === 'connection.update') {
      const state = body.data?.state;
      console.log(`[Evolution Webhook] Estado de conexión: ${state}`);
      if (state === 'open') {
        ioInstance.emit('whatsapp-status', 'connected');
      } else if (state === 'close') {
        ioInstance.emit('whatsapp-status', 'disconnected');
      }
    }
    // Mensajes entrantes
    else if (body.event === 'messages.upsert') {
      const msg = body.data?.message || body.data;
      if (msg && msg.key && !msg.key.fromMe) {
        const from = msg.key.remoteJid;
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          '[Multimedia]';
        const id = msg.key.id;
        const pushName = msg.pushName || from?.split('@')[0] || 'Desconocido';

        console.log(`[Evolution Webhook] Mensaje de ${pushName} (${from}): ${text.substring(0, 50)}`);

        ioInstance.emit('whatsapp-message', {
          id,
          from,
          name: pushName,
          text,
          fromMe: false,
          timestamp: new Date().toISOString(),
        });

        // Auto-registrar como lead si no existe
        try {
          const phone = from.split('@')[0];
          const existRes = await pool.query('SELECT id FROM leads WHERE phone = $1', [phone]);
          if (existRes.rowCount === 0) {
            await pool.query(
              `INSERT INTO leads (name, phone, score, status) VALUES ($1, $2, '50%', 'Nuevo')`,
              [pushName, phone]
            );
            console.log(`[Evolution] ✅ Nuevo lead registrado: ${pushName} (${phone})`);
          }
        } catch (dbErr: any) {
          console.error('[Evolution] Error auto-registrando lead:', dbErr.message);
        }

        // Respuesta con IA
        try {
          const aiReply = await generateAIResponse(from, text);
          if (aiReply) {
            await sendEvolutionMessage(from, aiReply);
            ioInstance.emit('whatsapp-message', {
              id: `ai-${id}`,
              from: 'bot',
              name: 'ChatPrex Bot',
              text: aiReply,
              fromMe: true,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (aiErr: any) {
          console.error('[Evolution] Error generando respuesta IA:', aiErr.message);
        }
      }
    }
  } catch (err: any) {
    console.error('[Evolution Webhook] Error procesando evento:', err.message);
  }

  res.sendStatus(200);
});

export { evolutionRouter };
