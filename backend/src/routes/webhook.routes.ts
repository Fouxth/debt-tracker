import { Router } from 'express';

const router = Router();

/**
 * Webhook for LINE Messaging API
 * Listens for "token" message and replies with the user's User ID.
 */
router.get('/', (_req, res) => {
  res.send('LINE Webhook is ready! (Please use POST for LINE events)');
});

router.post('/', async (req, res) => {
  try {
    const events = req.body.events;
    if (!events || !Array.isArray(events)) {
      return res.sendStatus(200);
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim().toLowerCase();
        
        // If user types "token" or "id"
        if (text === 'token' || text === 'id') {
          const userId = event.source.userId;
          const replyToken = event.replyToken;

          if (channelAccessToken) {
            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${channelAccessToken}`
              },
              body: JSON.stringify({
                replyToken: replyToken,
                messages: [
                  { 
                    type: 'text', 
                    text: `รหัส User ID ของคุณคือ:\n${userId}\n\nคัดลอกรหัสนี้ไปใส่ในช่อง "LINE User ID" ในหน้าตั้งค่าของระบบได้เลยครับ 🚀` 
                  }
                ]
              })
            });
          }
        }
      }
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

export default router;
