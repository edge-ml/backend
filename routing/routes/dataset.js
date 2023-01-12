const Router      = require('koa-router');
const KoaBody      = require('koa-body');

const controller = require('../../controller/dataset');

const router = new Router();

const subroutes = {
	result: require('./subroutes/result'),
	labeling: require('./subroutes/labeling'),
	video: require('./subroutes/video'),
	timeSeries: require('./subroutes/timeseries'),
	labels: require('./subroutes/labels')
};

router.use('/:datasetId/results', subroutes.result.routes(), subroutes.result.allowedMethods());
router.use('/:datasetId/labelings', subroutes.labeling.routes(), subroutes.labeling.allowedMethods());
router.use('/:datasetId/video', subroutes.video.routes(), subroutes.video.allowedMethods());
router.use('/:datasetId/timeseries', subroutes.timeSeries.routes(), subroutes.timeSeries.allowedMethods());
router.use('/:datasetId/labels', subroutes.labels.routes(), subroutes.labels.allowedMethods());

/**
 * get all datasets for current user
 * route:					/datasets
 * method type: 	GET
 */
router.get('/', async (ctx, next) => {
	await controller.getDatasets(ctx, next);
});

/**
 * get dataset by id for current user
 * route:					/datasets/:id
 * method type: 	GET
 */
router.get('/:id', async (ctx) => {
	await controller.getDatasetById(ctx);
});

/**
 * get dataset lock by id for current user
 * route:					/datasets/:id
 * method type: 	GET
 */
 router.get('/canedit/:id', async (ctx) => {
	await controller.getDatasetLockById(ctx);
});

/**
 * create a new dataset
 * route:					/datasets
 * method type: 	POST
 */
router.post('/', KoaBody({jsonLimit: '500mb'}), async (ctx) => {
	await controller.createDataset(ctx);
});

/**
 * update a specific datasets
 * route:					/datasets/:id
 * method type: 	PUT
 */
router.put('/:id', KoaBody({jsonLimit: '50mb'}), async (ctx) => {
	await controller.updateDatasetById(ctx);
});

/**
 * update canEdit of a specific dataset
 * route:					/datasets/:id/canEdit
 * method type: 	PUT
 */
 router.put('/canedit/:id', KoaBody(), async (ctx) => {
	await controller.canEditDatasetById(ctx);
});

/**
 * delete a specific dataset
 * route:					/datasets/:id
 * method type: 	DELETE
 */
router.del('/:id', async (ctx) => {
	await controller.deleteDatasetById(ctx);
});

module.exports = router;
