import { Router } from 'express';
import crypto from 'crypto';
import { handleBotCommand } from '../services/chatbot.service';

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
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (channelSecret) {
      const signature = String(req.headers['x-line-signature'] ?? '');
      const rawBody = (req as any).rawBody;
      if (!Buffer.isBuffer(rawBody)) {
        return res.sendStatus(400);
      }

      const expectedSignature = crypto
        .createHmac('sha256', channelSecret)
        .update(rawBody)
        .digest('base64');

      if (signature !== expectedSignature) {
        return res.sendStatus(401);
      }
    }

    const events = req.body.events;
    if (!events || !Array.isArray(events)) {
      return res.sendStatus(200);
    }

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text;
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        // Route to our new Chatbot Service
        await handleBotCommand(text, userId, replyToken);
      }
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

export default router;
