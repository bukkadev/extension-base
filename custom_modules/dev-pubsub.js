const WebSocket = require('ws');

class DevPubSubServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Set();

        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log("Dev PubSub connected");
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
    }

    broadcast(data) {
        const message = JSON.stringify({
            data: JSON.stringify(data) // Match Twitch's double-encoded format
        });

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

module.exports = DevPubSubServer;