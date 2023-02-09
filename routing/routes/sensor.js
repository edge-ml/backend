const Router      = require('koa-router');
const KoaBody      = require('koa-body');

const controller = require('../../controller/sensor');
const {validate_user_project} = require('../../auth/auth')

const router = new Router();

router.use(async (ctx, next) => {
    await validate_user_project(ctx, next)
})


/**
 * get all sensors for current user
 * route:					/sensors
 * method type: 	GET
 */
router.get('/', async (ctx) => {
	await controller.getSensors(ctx);
});

/**
 * get sensor by id
 * route:					/sensors/:id
 * method type: 	GET
 */
router.get('/:id', async (ctx) => {
	await controller.getSensorById(ctx);
});

/**
 * create a new sensor
 * route:					/sensors
 * method type: 	POST
 */
router.post('/', KoaBody(), async (ctx) => {
	await controller.createSensor(ctx);
});

/**
 * update a specific sensors
 * route:					/sensors/:id
 * method type: 	PUT
 */
router.put('/:id', KoaBody(), async (ctx) => {
	await controller.updateSensorById(ctx);
});

/**
 * delete all sensors
 * route:					/sensors
 * method type: 	DELETE
 */
router.del('/', async (ctx) => {
	await controller.deleteSensors(ctx);
});

/**
 * delete a specific sensor
 * route:					/Sensors/:id
 * method type: 	DELETE
 */
router.del('/:id', async (ctx) => {
	await controller.deleteSensorById(ctx);
});


module.exports = router;
