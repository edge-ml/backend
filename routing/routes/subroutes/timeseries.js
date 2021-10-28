const Router = require("koa-router");
const KoaBody = require("koa-body");

const controller = require("../../../controller/timeseries");

const router = new Router();

router.post("/append", KoaBody(), async (ctx) => {
  await controller.appendData(ctx);
});

module.exports = router;
