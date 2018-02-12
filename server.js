
const Hapi = require('hapi');

const port = process.env.PORT || 8000;
const messengerToken = process.env.MESSENGER_TOKEN || 'test_token';

console.log('Server port', port);

const server = Hapi.server({ 
    port: port 
});


server.route({
    method: 'GET',
    path:'/', 
    handler: function (request, h) {
        return {status: 'ok'};
    }
});

server.route({
    method: 'POST',
    path: '/webhook',
    handler: function (request, h) {
        let body = request.payload;

        // Checks this is an event from a page subscription
        if (body.object !== 'page') {
            return h
                .response()
                .code(404);
        }

        body.entry.forEach(function(entry) {
            let webhookEvent = entry.messaging[0];
            console.log('webhook_event', webhookEvent);
            let senderPsid = webhookEvent.sender.id;
            console.log('Sender PSID: ' + senderPsid);
        });

        return h
            .response('EVENT_RECEIVED')
            .code(200);
    }
});

server.route({
    method: 'GET',
    path: '/webhook',
    handler: function (request, h) {
        let mode = request.query['hub.mode'];
        let token = request.query['hub.verify_token'];
        let challenge = request.query['hub.challenge'];
        
        if (!mode || !token) {
            return h
                .response('Missing query parameters.')
                .code(403);
        }

        if (mode !== 'subscribe') {
            return h
                .response('Invalid mode.')
                .code(403);
        }

        if (token !== messengerToken) {
            return h
                .response('Invalid token.')
                .code(403);
        }

        console.log('WEBHOOK_VERIFIED');
        return h
            .response(challenge)
            .code(200);
    }
});

function handleMessage(sender_psid, received_message) {

}

function handlePostback(sender_psid, received_postback) {

}

function callSendAPI(sender_psid, response) {
  
}

module.exports = server;
