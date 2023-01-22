const Router = require('koa-router');
const KoaBody = require('koa-body');

const controller = require('../../../controller/timeseries');

const router = new Router();

router.post('/append', KoaBody(), async (ctx) => {
	await controller.appendData(ctx);
});

router.get('/', KoaBody(), async (ctx) => {
	console.time('getDatasetTimeseriesByIdRoute ' + JSON.stringify(ctx.query))
	await controller.getDatasetTimeseriesById(ctx).catch(console.error);
	console.timeEnd('getDatasetTimeseriesByIdRoute ' + JSON.stringify(ctx.query))
});

module.exports = router;
