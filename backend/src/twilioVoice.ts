import express from 'express';
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export const voiceRouter = express.Router();

/**
 * Webhook inicial de Twilio.
 * Cuando alguien llama al número de Twilio, Twilio hace una petición POST aquí.
 * Respondemos con TwiML (Twilio Markup Language) indicando que debe abrir un Media Stream WebSocket.
 */
voiceRouter.post('/', (req, res) => {
  console.log('[Twilio] Llamada entrante recibida.');
  
  // URL base del servidor (WSS para producción, WS para local si se usa ngrok)
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
  
  // TwiML para conectar el stream de audio
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${wsProtocol}://${host}/media-stream" />
    </Connect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

/**
 * Configura el servidor WebSocket para recibir el stream de audio bidireccional desde Twilio.
 * Aquí es donde conectaremos el audio con OpenAI Realtime API en el futuro.
 */
export const setupVoiceWebSockets = (server: HttpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/media-stream') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[Twilio Media Stream] Conexión WebSocket establecida.');
    let streamSid: string | null = null;

    ws.on('message', (message: string) => {
      try {
        const msg = JSON.parse(message);
        
        if (msg.event === 'start') {
          streamSid = msg.start.streamSid;
          console.log(`[Twilio] Stream de audio iniciado. streamSid: ${streamSid}`);
          // TODO: Inicializar conexión con OpenAI Realtime API aquí.
        } else if (msg.event === 'media') {
          // Chunk de audio recibido (mulaw).
          // const audioPayload = msg.media.payload;
          // TODO: Enviar audioPayload a OpenAI Realtime API.
        } else if (msg.event === 'stop') {
          console.log(`[Twilio] Stream detenido. streamSid: ${streamSid}`);
          // TODO: Cerrar conexión con OpenAI.
        }
      } catch (error) {
        console.error('[Twilio Media Stream] Error procesando mensaje:', error);
      }
    });

    ws.on('close', () => {
      console.log('[Twilio Media Stream] Conexión WebSocket cerrada.');
    });
  });
};
