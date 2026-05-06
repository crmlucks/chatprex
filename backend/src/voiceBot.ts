import fetch from 'node-fetch';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('⚠️ OPENAI_API_KEY not set – voice transcription will be unavailable.');
}

// Meta credentials (reuse existing env vars)
const META_TOKEN = process.env.META_WHATSAPP_TOKEN || '';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';

/**
 * Obtains a temporary download URL for a media object from Meta Graph API.
 * @param mediaId The ID of the media object returned in the webhook payload.
 */
async function getMediaUrl(mediaId: string): Promise<string | null> {
  if (!META_ACCESS_TOKEN) {
    console.error('[VoiceBot] META_ACCESS_TOKEN not configured.');
    return null;
  }
  const url = `https://graph.facebook.com/v13.0/${mediaId}?access_token=${META_ACCESS_TOKEN}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('[VoiceBot] Failed to fetch media info', resp.status, txt);
      return null;
    }
    const data = await resp.json();
    return data.url; // Meta returns { url: 'https://...'}
  } catch (e: any) {
    console.error('[VoiceBot] Network error fetching media URL', e.message);
    return null;
  }
}

/**
 * Downloads the audio file from the provided URL and returns a Buffer.
 */
async function downloadAudio(url: string): Promise<Buffer | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('[VoiceBot] Failed to download audio', resp.status, txt);
      return null;
    }
    const arrayBuffer = await resp.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e: any) {
    console.error('[VoiceBot] Network error downloading audio', e.message);
    return null;
  }
}

/**
 * Sends an audio buffer to OpenAI Whisper for transcription.
 * Returns the transcribed text, or null on failure.
 */
export async function transcribeAudio(buffer: Buffer, mimeType: string = 'audio/ogg'): Promise<string | null> {
  if (!openai) {
    console.warn('[VoiceBot] OpenAI not configured – cannot transcribe.');
    return null;
  }
  try {
    // OpenAI SDK expects a File or ReadStream. We create a File object.
    const file = new File([new Uint8Array(buffer)], 'voice_message.ogg', { type: mimeType });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });
    return transcription.text;
  } catch (e: any) {
    console.error('[VoiceBot] OpenAI transcription error', e.message);
    return null;
  }
}

/**
 * High‑level helper used by the WhatsApp webhook handler.
 * Given a media ID, it fetches, downloads and transcribes the voice message.
 */
export async function handleVoiceMessage(mediaId: string, mimeType?: string): Promise<string | null> {
  const mediaUrl = await getMediaUrl(mediaId);
  if (!mediaUrl) return null;
  const audioBuffer = await downloadAudio(mediaUrl);
  if (!audioBuffer) return null;
  const text = await transcribeAudio(audioBuffer, mimeType);
  return text;
}
