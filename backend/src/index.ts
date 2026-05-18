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
import { analyticsRouter } from './analyticsRoutes';
import { voiceRouter, setupVoiceWebSockets } from './twilioVoice';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 5e7 // Aumentar límite a 50MB para multimedia
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
app.use('/api/analytics', analyticsRouter);

// ─── Rutas de WhatsApp ───
app.use('/api/webhook/meta', whatsappRouter);
app.use('/api/webhook/evolution', evolutionRouter);
app.use('/api/ai-mode', aiModeRouter);

// ─── Rutas de Voz (Twilio) ───
app.use('/api/webhook/twilio', voiceRouter);

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
  
  // Inicializar WebSockets para Twilio Voice API
  setupVoiceWebSockets(server);
});
