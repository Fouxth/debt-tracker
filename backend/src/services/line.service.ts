import sql from '../db';

/**
 * Sends a notification via LINE.
 * Supports both Messaging API (Push Message to User ID) and LINE Notify (Token).
 */
export async function sendLineNotify(message: string, eventType: 'payment' | 'loan' | 'expense' | 'fraud') {
  try {
    // 1. Load settings from DB
    const settings = await sql`SELECT value FROM settings WHERE key = 'line_notify'`;
    if (!settings || settings.length === 0) return;
    
    const config = settings[0].value;
    
    // Check if LINE Notify is enabled
    if (!config || !config.enabled) return;
    
    // Check if this specific event type is enabled
    if (config.events && config.events[eventType] === false) return;

    // 2. Try Messaging API first (Push Message)
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (channelAccessToken && config.userId) {
      try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${channelAccessToken}`
          },
          body: JSON.stringify({
            to: config.userId,
            messages: [{ type: 'text', text: message }]
          })
        });

        if (response.ok) return; // Successfully sent via Messaging API
        
        const errorData = await response.json().catch(() => ({}));
        console.error('Messaging API push failed:', response.status, errorData);
      } catch (error) {
        console.error('Failed to send via Messaging API:', error);
      }
    }

    // 3. Fallback to LINE Notify
    if (config.token) {
      const params = new URLSearchParams();
      params.append('message', `\n${message}`);

      await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
    }
  } catch (error) {
    console.error('Failed to send LINE notification:', error);
  }
}
