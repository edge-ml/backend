const Router = require("koa-router");
const KoaBody = require("koa-body");

const controller = require("../../controller/deviceApi");

const router = new Router();

router.get("/setKey", async (ctx) => {
  await controller.setApiKey(ctx);
});

router.get("/getKey", async (ctx) => {
  await controller.getApiKey(ctx);
});

router.get("/deleteKey", async (ctx) => {
  await controller.removeKey(ctx);
});

router.post("/uploadDataset", KoaBody(), async (ctx) => {
  await controller.uploadDataset(ctx);
});

router.post("/switchActive", KoaBody(), async (ctx) => {
  await controller.switchActive(ctx);
});

router.post("/initDatasetIncrement", KoaBody(), async (ctx) => {
  await controller.initDatasetIncrement(ctx);
});

router.post("/addDatasetIncrement", KoaBody(), async (ctx) => {
  await controller.addDatasetIncrement(ctx);
});

router.post("/addDatasetIncrementBatch", KoaBody(), async (ctx) => {
  await controller.addDatasetIncrementBatch(ctx);
});

router.post("/addDatasetIncrementIot", KoaBody(), async (ctx) => {
  await controller.addDatasetIncrementIot(ctx);
});

router.post("/getProject", KoaBody(), async (ctx) => {
  await controller.getProject(ctx);
});

module.exports = router;
