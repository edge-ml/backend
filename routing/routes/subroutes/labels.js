const Router      = require('koa-router');
const KoaBody      = require('koa-body');

const controller = require('../../../controller/datasetLabels');

const router = new Router();

router.post('/:labelingId', KoaBody(), async (ctx) => {
	await controller.createLabel(ctx);
});

router.put('/:labelingId/', KoaBody(), async (ctx) => {
    await controller.changeLabel(ctx);
});

router.delete('/:labelingId/:labelId', async (ctx) => {
    await controller.deleteLabel(ctx);
});

module.exports = router;
