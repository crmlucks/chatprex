import fetch from 'node-fetch';

// Environment variables – ensure they exist in .env
const META_PIXEL_ID = process.env.META_PIXEL_ID || '';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';

/**
 * Sends a server‑side event to Meta Conversion API (Facebook Pixel).
 *
 * @param eventName    Name of the event (e.g., 'Purchase', 'Lead')
 * @param eventTime    Unix timestamp (seconds). Defaults to now.
 * @param userData     Object with user identifiers (email, phone, etc.).
 *                     Values should be SHA‑256 hashed strings as required by Meta.
 * @param customData   Optional custom key‑value pairs (currency, value, etc.)
 * @param testEventCode Optional test code for testing without affecting real metrics.
 * @returns {Promise<boolean>} true if the request succeeded (status 200‑299).
 */
export async function sendMetaConversionEvent(
  eventName: string,
  userData: Record<string, string>,
  customData?: Record<string, any>,
  testEventCode?: string,
  eventTime?: number
): Promise<boolean> {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    console.warn('[MetaConversion] Pixel ID or Access Token not configured.');
    return false;
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: eventTime ?? Math.floor(Date.now() / 1000),
        user_data: userData,
        custom_data: customData ?? {},
        action_source: 'website',
      },
    ],
    // When testEventCode is provided, Meta treats the call as a test.
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  const url = `https://graph.facebook.com/v13.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[MetaConversion] API error', response.status, err);
      return false;
    }
    console.log('[MetaConversion] Event sent successfully:', eventName);
    return true;
  } catch (e: any) {
    console.error('[MetaConversion] Network error', e.message);
    return false;
  }
}
