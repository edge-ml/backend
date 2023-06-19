const Router = require("koa-router");
const { koaBody } = require('koa-body');

const controller = require("../../controller/deviceApi");
const {validate_user_project} = require('../../auth/auth')

const router = new Router();

router.use(async (ctx, next) => {
  await validate_user_project(ctx, next)
})


router.get("/setKey", async (ctx) => {
  await controller.setApiKey(ctx);
});

router.get("/getKey", async (ctx) => {
  await controller.getApiKey(ctx);
});

router.get("/deleteKey", async (ctx) => {
  await controller.removeKey(ctx);
});

router.post("/uploadDataset", koaBody(), async (ctx) => {
  await controller.uploadDataset(ctx);
});

router.post("/switchActive", koaBody(), async (ctx) => {
  await controller.switchActive(ctx);
});

router.post("/initDatasetIncrement", koaBody(), async (ctx) => {
  await controller.initDatasetIncrement(ctx);
});

router.post("/addDatasetIncrement", koaBody(), async (ctx) => {
  await controller.addDatasetIncrement(ctx);
});

router.post("/addDatasetIncrementBatch", koaBody(), async (ctx) => {
  await controller.addDatasetIncrementBatch(ctx);
});

router.post("/addDatasetIncrementIot", koaBody(), async (ctx) => {
  await controller.addDatasetIncrementIot(ctx);
});

router.post("/getProject", koaBody(), async (ctx) => {
  await controller.getProject(ctx);
});

module.exports = router;
