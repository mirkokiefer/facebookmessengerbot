
const assert = require('assert');
const request = require('superagent');

const server = require('./server');

test();

async function test() {
	await startServer();
	await testWebhookMessage();
	await testWebhookVerify();

	console.log('Success');
	process.exit(0);
}

async function startServer() {
	try {
	    await server.start();
	}
	catch (err) {
	    console.log(err);
	    process.exit(1);
	}
}

async function testWebhookMessage() {
	try {
		const res = await request
			.post('http://localhost:8000/webhook')
			.send({
				object: 'page',
				entry: [
					{messaging: [{sender: {id: 'userid'}}]},
					{messaging: [{sender: {id: 'userid'}}]}
				]
			});
		assert.equal(res.status, 200);
	}
	catch (err) {
		console.error(err);
	}
}

async function testWebhookVerify() {
	try {
		const res = await request
			.get('http://localhost:8000/webhook?hub.mode=subscribe&hub.verify_token=test_token&hub.challenge=test');
		assert.equal(res.status, 200);
	}
	catch (err) {
		console.error(err);
	}
}