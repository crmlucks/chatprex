import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { initDatabase } from './db';
import { sendMetaConversionEvent } from './metaConversion';
import { initWhatsApp, whatsappRouter, aiModeRouter } from './whatsapp';
import { authRouter } from './authRoutes';
import { userRouter } from './userRoutes';
import { leadRouter } from './leadRoutes';
import { propertyRouter } from './propertyRoutes';
import { initEvolution, evolutionRouter } from './evolution';
import { aiConfigRouter } from './aiRoutes';
import crudRouter from './crudRoutes';
import { campaignRouter } from './campaignRoutes';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── Rutas de autenticación (públicas) ───
app.use('/api/auth', authRouter);

// ─── Rutas de usuarios (protegidas) ───
app.use('/api/users', userRouter);

// ─── Rutas CRM (protegidas) ───
app.use('/api/leads', leadRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/ai-config', aiConfigRouter);
app.use('/api/data', crudRouter);
app.use('/api/campaigns', campaignRouter);

// ─── Rutas de WhatsApp ───
app.use('/api/webhook/meta', whatsappRouter);
app.use('/api/webhook/evolution', evolutionRouter);
app.use('/api/ai-mode', aiModeRouter);

// ─── Meta Conversion API ───
app.post('/api/meta/conversion', async (req, res) => {
  const { eventName, userData, customData, testEventCode, eventTime } = req.body;
  if (!eventName || !userData) {
    return res.status(400).json({ error: 'eventName and userData are required' });
  }
  const success = await sendMetaConversionEvent(eventName, userData, customData, testEventCode, eventTime);
  if (success) {
    res.json({ status: 'ok' });
  } else {
    res.status(500).json({ error: 'Failed to send conversion event' });
  }
});

// ─── Health check ───
app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', message: 'ChatPrex Backend está en línea' });
});

// ─── WebSockets ───
io.on('connection', (socket) => {
  console.log(`[Socket] Cliente conectado: ${socket.id}`);

  // Enviar mensaje de texto desde el CRM al WhatsApp
  socket.on('send-message', async (data: { to: string; text: string; media?: string; fileName?: string }) => {
    console.log(`[Socket] ═══ SEND-MESSAGE RECIBIDO ═══`);
    console.log(`[Socket] To: ${data.to}`);
    console.log(`[Socket] Text: ${data.text?.substring(0, 80)}`);
    console.log(`[Socket] Media: ${data.media ? `SI (${data.media.substring(0, 30)}... ${data.media.length} chars)` : 'NO'}`);
    console.log(`[Socket] FileName: ${data.fileName || '(ninguno)'}`);
    
    try {
      const { sendEvolutionMessage, sendEvolutionMedia } = await import('./evolution');
      
      // Apagar el bot automáticamente cuando el humano interviene
      try {
        const { default: pool } = await import('./db');
        const phone = data.to.split('@')[0];
        await pool.query('UPDATE leads SET bot_active = false WHERE phone = $1', [phone]);
        console.log(`[Bot] ⏸️ Bot desactivado para ${phone}`);
      } catch (dbErr: any) {
        console.error('[Bot] Error desactivando bot:', dbErr.message);
      }

      if (data.media && data.media.startsWith('data:')) {
        console.log(`[Socket] → Enviando MULTIMEDIA...`);
        await sendEvolutionMedia(data.to, data.media, data.text, data.fileName);
      } else if (data.text) {
        console.log(`[Socket] → Enviando TEXTO...`);
        await sendEvolutionMessage(data.to, data.text);
      } else {
        console.log(`[Socket] ⚠️ No hay texto ni media para enviar`);
      }
      console.log(`[Socket] ═══ SEND-MESSAGE COMPLETADO ═══`);
    } catch (err: any) {
      console.error('[Socket] ❌ Error enviando mensaje:', err.message);
      socket.emit('send-error', { error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
  });
});

// ─── Arrancar servidor ───
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);

  // Inicializar base de datos (crear tablas si no existen)
  await initDatabase();

  // Inicializar WhatsApp y Evolution
  initWhatsApp(io);
  initEvolution(io);
});
