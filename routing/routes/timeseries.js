const Router      = require('koa-router');
const KoaBody      = require('koa-body');

const controller = require("../../controller/timeseries");

const router = new Router()

router.post("/metaData", KoaBody(), async (ctx) => {
    return controller.getTimeSeriesMetaData(ctx)
});

module.exports = router;