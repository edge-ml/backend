const Router      = require('koa-router');
const KoaBody      = require('koa-body');

const controller = require('../../controller/firmware');

const router = new Router();

router.use(async (ctx, next) => {
    await validate_user_project()
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
router.post('/', KoaBody(), async (ctx) => {
	await controller.createFirmware(ctx);
});

/**
 * update a firmware specified by id
 * route:					/firmware/:id
 * method type: 	PUT
 */
router.put('/:id', KoaBody(), async (ctx) => {
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
