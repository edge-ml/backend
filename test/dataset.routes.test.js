// require supertest
const request = require('supertest');

// require the Koa server
const server = require('../server');

// do something before anything else runs
beforeAll(async () => {
	console.log('Jest starting!');
});

// close the server after each test
afterEach(() => {
	server.close();
	console.log('server closed!');
});

// testing dataset routing
describe('Testing dataset routing', () => {
	test('get all datasets  GET /dataset', async () => {
		const response = await request(server).get('/dataset');
		expect(response.status).toEqual(200);
		expect(response.type).toEqual('application/json');
	});
});
