
const Hapi = require('hapi');
const request = require('superagent');

const port = process.env.PORT || 8000;
const messengerToken = process.env.MESSENGER_TOKEN || 'test_messenger_token';
const accessToken = process.env.FB_PAGE_ACCESS_TOKEN || 'test_access_token';

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
            if (!entry.messaging) {
                console.log('missing messaging property', entry);
                return h
                    .response()
                    .code(400);
            }

            let webhookEvent = entry.messaging[0];
            console.log('webhook_event', webhookEvent);
            let senderPsid = webhookEvent.sender.id;
            console.log('Sender PSID: ' + senderPsid);

            if (webhookEvent.message) {
                handleMessage(senderPsid, webhookEvent.message);        
            } else if (webhookEvent.postback) {
                handlePostback(senderPsid, webhookEvent.postback);
            }
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

function handleMessage(senderPsid, receivedMessage) {
    console.log('handleMessage', senderPsid, receivedMessage);

    if (receivedMessage.text) {
        const response = {
          text: `You sent the message: "${receivedMessage.text}". Now send me an image!`
        }

        callSendAPI(senderPsid, response);
        return;
    }

    if (receivedMessage.attachments) {
        const attachmentUrl = receivedMessage.attachments[0].payload.url;
        console.log('handleMessage', 'attachment', attachmentUrl);

        response = {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements: [{
                        title: 'Is this the right picture?',
                        subtitle: 'Tap a button to answer.',
                        image_url: attachmentUrl,
                        buttons: [
                            {
                                type: 'postback',
                                title: 'Yes!',
                                payload: 'yes',
                            }, {
                                type: 'postback',
                                title: 'No!',
                                payload: 'no',
                            }
                        ]
                    }]
                }
            }
        };

        callSendAPI(senderPsid, response);
        return;
    }
}

function handlePostback(senderPsid, receivedPostback) {
    console.log('handlePostback', senderPsid, receivedPostback);

    const payload = receivedPostback.payload;

    response = getPostbackResponse(payload);

    callSendAPI(senderPsid, response);
}

function getPostbackResponse(payload) {
    switch (payload) {
        case 'yes':
            return {text: 'Thanks!'};
        case 'no':
            return {text: 'Oops, try sending another image.'};
    }
}

async function callSendAPI(senderPsid, response) {
    console.log('callSendAPI', senderPsid, response);

    let requestBody = {
        recipient: {
            id: senderPsid
        },
        message: response
    };

    try {
        const result = await request
            .post(`https://graph.facebook.com/v2.6/me/messages?access_token=${accessToken}`)
            .send(requestBody);
        console.log('Message sent!');
    } catch (err) {
        console.error(err);
    }
}

module.exports = server;
