const Router = require('koa-router');
const KoaBody = require('koa-body');

const controller = require('../../controller/arduinoFirmware');
const { validate_user_project } = require('../../auth/auth');

const router = new Router();

router.use(async (ctx, next) => {
    await validate_user_project(ctx, next)
})

router.get("/:deviceName", async (ctx) => {
    await controller.getFirmware(ctx);
});

module.exports = router;