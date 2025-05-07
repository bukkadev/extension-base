const socketIo = require('socket.io');

class DevPubSubServer {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.NODE_ENV === 'development' ? '*' : ['https://your-production-domain.com'],
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
    //   console.log('Client connected');

      socket.on('dev-message', (data) => {
        try {
          console.log('Received dev message:', data);
          
          const broadcastData = {
            data: typeof data === 'string' ? data : JSON.stringify(data)
          };

          this.io.emit('broadcast', broadcastData);
          socket.emit('dev-message-received', data);
        } catch (error) {
          console.error('Error processing message:', error);
          socket.emit('error', { message: 'Error processing message' });
        }
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socket.on('disconnect', () => {
        // console.log('Client disconnected');
      });
    });

    this.io.engine.on('connection_error', (err) => {
      console.error('Connection error:', err);
    });
  }
}

module.exports = DevPubSubServer;