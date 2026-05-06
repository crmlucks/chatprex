import { Server } from 'socket.io';
import express from 'express';
import { generateAIResponse } from './ai';

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
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      headers: getHeaders()
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data?.instance?.state === 'open') {
        socket.emit('whatsapp-status', 'connected');
      } else {
        fetchEvolutionQR(socket);
      }
    } else if (res.status === 404) {
      fetchEvolutionQR(socket);
    }
  } catch (error) {
    console.error('Error checking Evolution status:', error);
  }
};

export const fetchEvolutionQR = async (socket: any) => {
  try {
    // Intentar conectar primero para obtener el QR si la instancia ya existe
    const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
      headers: getHeaders()
    });
    
    if (connectRes.ok) {
      const connectData = await connectRes.json();
      if (connectData?.base64) {
        socket.emit('whatsapp-qr', connectData.base64);
        return;
      }
    }

    // Si falla, crear la instancia
    const payload = {
      instanceName: INSTANCE_NAME,
      token: INSTANCE_NAME,
      qrcode: true,
      webhook: WEBHOOK_URL,
      events: ["APPLICATION_STARTUP", "QRCODE_UPDATED", "MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE", "CONNECTION_UPDATE"]
    };

    const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.qrcode?.base64) {
        socket.emit('whatsapp-qr', data.qrcode.base64);
      } else if (data?.instance?.state === 'open') {
        socket.emit('whatsapp-status', 'connected');
      }
    }
  } catch (error) {
    console.error('Error fetching Evolution QR:', error);
    socket.emit('whatsapp-status', 'Falla de Conexión Evolution');
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

        ioInstance.emit('whatsapp-message', {
          id,
          from,
          name: from,
          text,
          fromMe: false,
          timestamp: new Date().toISOString()
        });

        // Simple IA integration
        // Here we could call N8N or local AI just like in Meta API
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
