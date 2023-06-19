const Router      = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../../controller/firmware');
const {validate_user_project} = require('../../auth/auth')

const router = new Router();

router.use(async (ctx, next) => {
    await validate_user_project(ctx, next)
})


/**
 * get all firmware
 * route:					/firmware
 * method type: 	GET
 */
router.get('/', async (ctx) => {
	await controller.getFirmware(ctx);
});

/**
 * get firmware by id
 * route:					/firmware/:id
 * method type: 	GET
 */
router.get('/:id', async (ctx) => {
	await controller.getFirmwareById(ctx);
});

/**
 * create a new firmware
 * route:					/firmware
 * method type: 	POST
 */
router.post('/', koaBody(), async (ctx) => {
	await controller.createFirmware(ctx);
});

/**
 * update a firmware specified by id
 * route:					/firmware/:id
 * method type: 	PUT
 */
router.put('/:id', koaBody(), async (ctx) => {
	await controller.updateFirmwareById(ctx);
});

/**
 * delete all firmware
 * route:					/firmware
 * method type: 	DELETE
 */
router.del('/', async (ctx) => {
	await controller.deleteFirmware(ctx);
});

/**
 * delete a firmware specified by id
 * route:					/firmware/:id
 * method type: 	DELETE
 */
router.del('/:id', async (ctx) => {
	await controller.deleteFirmwareById(ctx);
});


module.exports = router;
