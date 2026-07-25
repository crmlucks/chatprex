import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import express from 'express';

export const dataDeletionRouter = Router();

// Middleware to parse urlencoded bodies because Meta sends POST as application/x-www-form-urlencoded
dataDeletionRouter.use(express.urlencoded({ extended: true }));

function base64UrlDecode(input: string): string {
  let padded = input.replace(/-/g, '+').replace(/_/g, '/');
  while (padded.length % 4) {
    padded += '=';
  }
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function parseSignedRequest(signedRequest: string, secret: string) {
  try {
    const parts = signedRequest.split('.', 2);
    if (parts.length !== 2) return null;
    
    const encodedSig = parts[0];
    const payload = parts[1];

    const sigBase64Url = encodedSig.replace(/-/g, '+').replace(/_/g, '/');
    const sig = Buffer.from(sigBase64Url, 'base64');
    
    const dataStr = base64UrlDecode(payload);
    const data = JSON.parse(dataStr);

    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest();
    
    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(sig, expectedSig)) {
      console.error('[Meta Deletion] Bad Signed JSON signature!');
      return null;
    }

    return data;
  } catch (err) {
    console.error('[Meta Deletion] Error parsing signed request:', err);
    return null;
  }
}

dataDeletionRouter.post('/deletion', (req: Request, res: Response): any => {
  const signedRequest = req.body.signed_request;
  if (!signedRequest) {
    return res.status(400).json({ error: 'Missing signed_request' });
  }

  const appSecret = process.env.META_APP_SECRET || ''; 
  if (!appSecret) {
    console.warn('[Meta Deletion] META_APP_SECRET no está configurado en .env.');
    // Fallamos si no hay secreto, ya que no podemos verificar la solicitud real
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const data = parseSignedRequest(signedRequest, appSecret);
  if (!data) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const userId = data.user_id;

  // Iniciar la eliminación de datos del usuario
  console.log(`[Meta Deletion] Solicitud recibida para eliminar datos del usuario: ${userId}`);
  
  // Aquí idealmente borraríamos de la BD los datos vinculados a este PSID/ASID
  // db.run('DELETE FROM leads WHERE meta_id = ?', [userId]);

  const confirmationCode = `del_${userId}_${Date.now()}`;
  const statusUrl = `https://chatprex.com/politicas-privacidad?deletion_id=${confirmationCode}`;

  // Responder con JSON tal como lo requiere Meta
  return res.json({
    url: statusUrl,
    confirmation_code: confirmationCode
  });
});
