import { Server } from 'socket.io';
import express from 'express';
import { generateAIResponse } from './ai';
import pool from './db';

const evolutionRouter = express.Router();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN || '';
const INSTANCE_NAME = 'ChatPrex';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://api.chatprex.com/api/webhook/evolution';

let ioInstance: Server | null = null;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_API_TOKEN
});

export const initEvolution = (io: Server) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    checkEvolutionStatus(socket);

    socket.on('request-evolution-qr', () => {
      fetchEvolutionQR(socket);
    });
  });
};

export const checkEvolutionStatus = async (socket: any) => {
  try {
    console.log(`[Evolution] Checking status for ${INSTANCE_NAME}...`);
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      headers: getHeaders()
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('[Evolution] Connection State:', data);
      if (data?.instance?.state === 'open') {
        socket.emit('whatsapp-status', 'connected');
      } else {
        await fetchEvolutionQR(socket);
      }
    } else {
      console.log(`[Evolution] State returned ${res.status}, fetching QR...`);
      await fetchEvolutionQR(socket);
    }
  } catch (error: any) {
    console.error('[Evolution] Error checking status:', error);
    socket.emit('whatsapp-status', `Falla Evolution (Status): ${error.message}`);
  }
};

export const fetchEvolutionQR = async (socket: any) => {
  try {
    console.log(`[Evolution] Attempting to connect ${INSTANCE_NAME}...`);
    const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
      headers: getHeaders()
    });
    
    if (connectRes.ok) {
      const connectData = await connectRes.json();
      console.log('[Evolution] Connect Data:', connectData);
      if (connectData?.base64) {
        socket.emit('whatsapp-qr', connectData.base64);
        return;
      }
    } else {
      const errText = await connectRes.text();
      console.log(`[Evolution] Connect failed (${connectRes.status}):`, errText);
    }

    console.log(`[Evolution] Creating instance ${INSTANCE_NAME}...`);
    const payload = {
      instanceName: INSTANCE_NAME,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      webhook: WEBHOOK_URL,
      webhook_by_events: false,
      webhook_base64: false,
      webhook_events: ["APPLICATION_STARTUP", "QRCODE_UPDATED", "MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE", "CONNECTION_UPDATE"]
    };

    const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log('[Evolution] Create Data:', data);
      if (data?.qrcode?.base64) {
        socket.emit('whatsapp-qr', data.qrcode.base64);
      } else if (data?.instance?.state === 'open') {
        socket.emit('whatsapp-status', 'connected');
      } else {
        // Fallback si no viene el QR pero se creó
        const fbRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, { headers: getHeaders() });
        const fbData = await fbRes.json();
        if (fbData?.base64) socket.emit('whatsapp-qr', fbData.base64);
      }
    } else {
      const errorText = await res.text();
      console.error('[Evolution] Failed to create instance:', errorText);
      socket.emit('whatsapp-status', `Falla Creación: ${errorText.substring(0, 50)}`);
    }
  } catch (error: any) {
    console.error('[Evolution] Error fetching QR:', error);
    socket.emit('whatsapp-status', `Falla Red: ${error.message}`);
  }
};

export const sendEvolutionMessage = async (to: string, text: string) => {
  const number = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
  try {
    await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ number, options: { delay: 1200 }, textMessage: { text } })
    });
  } catch (error) {
    console.error('Error sending message via Evolution API:', error);
  }
};

// Manejo de webhooks de Evolution API
evolutionRouter.post('/webhook', async (req, res) => {
  const body = req.body;
  if (!ioInstance) return res.sendStatus(200);

  try {
    if (body.event === 'qrcode.updated' && body.data?.qrcode?.base64) {
      ioInstance.emit('whatsapp-qr', body.data.qrcode.base64);
    } 
    else if (body.event === 'connection.update') {
      if (body.data?.state === 'open') {
        ioInstance.emit('whatsapp-status', 'connected');
      } else if (body.data?.state === 'close') {
        ioInstance.emit('whatsapp-status', 'disconnected');
      }
    }
    else if (body.event === 'messages.upsert') {
      const msg = body.data?.message;
      if (msg && !msg.key.fromMe) {
        const from = msg.key.remoteJid;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Multimedia]';
        const id = msg.key.id;
        const pushName = msg.pushName || from.split('@')[0];

        ioInstance.emit('whatsapp-message', {
          id,
          from,
          name: pushName,
          text,
          fromMe: false,
          timestamp: new Date().toISOString()
        });

        // Register as new lead if it doesn't exist
        try {
          const phone = from.split('@')[0];
          const existRes = await pool.query('SELECT id FROM leads WHERE phone = $1', [phone]);
          if (existRes.rowCount === 0) {
            await pool.query(
              `INSERT INTO leads (name, phone, score, status) VALUES ($1, $2, '50%', 'Nuevo')`,
              [pushName, phone]
            );
            console.log(`Nuevo lead registrado automáticamente: ${phone}`);
          }
        } catch (dbErr) {
          console.error('Error auto-registrando lead:', dbErr);
        }

        // Simple IA integration
        const aiReply = await generateAIResponse(from, text);
        if (aiReply) {
           await sendEvolutionMessage(from, aiReply);
           ioInstance.emit('whatsapp-message', {
             id: `ai-${id}`,
             from: 'bot',
             name: 'ChatPrex Bot',
             text: aiReply,
             fromMe: true,
             timestamp: new Date().toISOString()
           });
        }
      }
    }
  } catch (err) {
    console.error('Error handling Evolution webhook:', err);
  }

  res.sendStatus(200);
});

export { evolutionRouter };
