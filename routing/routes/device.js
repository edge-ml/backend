const Router      = require('koa-router');
const KoaBody      = require('koa-body');

const controller = require('../../controller/device');

const router = new Router();

/**
 * get all devices for current user
 * route:					/devices
 * method type: 	GET
 */
router.get('/', async (ctx) => {
	await controller.getDevices(ctx);
});

/**
 * get device by id
 * route:					/devices/:id
 * method type: 	GET
 */
router.get('/:name/:generation', async (ctx) => {
	await controller.getDeviceByNameAndGeneration(ctx);
});

/**
 * create a new device
 * route:					/devices
 * method type: 	POST
 */
router.post('/', KoaBody(), async (ctx) => {
	await controller.createDevice(ctx);
});

/**
 * update a specific devices
 * route:					/devices/:id
 * method type: 	PUT
 */
router.put('/:id', KoaBody(), async (ctx) => {
	await controller.updateDeviceById(ctx);
});




module.exports = router;
