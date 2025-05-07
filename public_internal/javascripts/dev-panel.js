document.addEventListener('DOMContentLoaded', function() {
    const socket = io();

    // Socket Message Testing
    const socketMessage = document.getElementById('socket-message');
    const sendSocketBtn = document.getElementById('send-socket');
    
    sendSocketBtn?.addEventListener('click', function() {
        try {
            const message = JSON.parse(socketMessage.value);
            socket.emit('dev-message', message);
            
            // Visual feedback
            showSuccess(sendSocketBtn);
        } catch (error) {
            console.error('Error sending socket message:', error);
            alert('Failed to send message: ' + error.message);
        }
    });

    // Direct Twitch PubSub Testing
    const channelId = document.getElementById('channel-id');
    const twitchMessage = document.getElementById('twitch-message');
    const sendTwitchBtn = document.getElementById('send-twitch-pubsub');

    sendTwitchBtn?.addEventListener('click', async function() {
        try {
            const response = await fetch('/admin/send-twitch-pubsub', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    channelId: channelId.value,
                    message: JSON.parse(twitchMessage.value),
                    forceTwitch: true // Flag to force Twitch PubSub
                })
            });

            if (!response.ok) throw new Error('Failed to send message');
            
            showSuccess(sendTwitchBtn);
        } catch (error) {
            console.error('Error sending Twitch message:', error);
            alert('Failed to send message: ' + error.message);
        }
    });

    // PubSub Event Testing (with fallback)
    const pubsubChannelId = document.getElementById('pubsub-channel-id');
    const pubsubMessage = document.getElementById('pubsub-message');
    const sendPubsubBtn = document.getElementById('send-pubsub');

    sendPubsubBtn?.addEventListener('click', async function() {
        try {
            const response = await fetch('/admin/send-pubsub', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    channelId: pubsubChannelId.value,
                    message: JSON.parse(pubsubMessage.value)
                })
            });

            if (!response.ok) throw new Error('Failed to send message');
            
            showSuccess(sendPubsubBtn);
        } catch (error) {
            console.error('Error sending PubSub message:', error);
            alert('Failed to send message: ' + error.message);
        }
    });

    // Success feedback helper
    function showSuccess(button) {
        const originalText = button.textContent;
        button.textContent = 'Sent!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }

    // Handle server acknowledgments
    socket.on('dev-message-received', function(data) {
        console.log('Server received message:', data);
    });
}); 