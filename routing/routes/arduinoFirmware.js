const Router = require('koa-router');
const KoaBody = require('koa-body');

const controller = require('../../controller/arduinoFirmware');

const router = new Router();

router.get("/:deviceName", async (ctx) => {
    await controller.getFirmware(ctx);
});

module.exports = router;