const express = require('express');
const router = express.Router();
const twitch = require('../custom_modules/twitch');
const { basicAuth, authLimiter } = require('../middleware/auth');

// Add authentication middleware to all admin routes
router.use(authLimiter);
router.use(basicAuth);

/* GET admin panel */
router.get('/', function(req, res, next) {
  res.render('admin/dev-panel', { title: 'Admin Panel' });
});

/* POST send Twitch PubSub message */
router.post('/send-twitch-pubsub', async function(req, res) {
  try {
    const { channelId, message } = req.body;
    
    await twitch.sendPubSub(
      channelId,
      'broadcast',
      'application/json',
      JSON.stringify(message)
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send Twitch PubSub:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Add new route for simulation example
router.post('/simulate-pubsub', async function(req, res) {
  try {
    const exampleMessage = {
      config: {
        show_extension: true
      }
    };
    
    await twitch.sendPubSubMessage('39754760', exampleMessage);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send simulation:', error);
    res.status(500).json({ error: 'Failed to send simulation' });
  }
});

// Direct Socket Message (dev only)
router.post('/send-socket', function(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Socket testing only available in development' });
  }

  const io = req.app.get('devPubSub').io;
  io.emit('broadcast', { data: JSON.stringify(req.body.message) });
  res.json({ success: true });
});

// PubSub with dev fallback
router.post('/send-pubsub', async function(req, res) {
  try {
    const { channelId, message } = req.body;
    const io = req.app.get('devPubSub')?.io;
    
    await twitch.sendPubSubMessage(channelId, message, io);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router; 