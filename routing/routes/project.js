const Router      = require('koa-router');
const { koaBody } = require('koa-body');

const controller = require('../../controller/projects');
const { validate_user } = require('../../auth/auth');

const router = new Router();

router.use(async (ctx, next) => {
    await validate_user(ctx, next)
})

router.get('/', async (ctx) => {
    console.log("GET PROJECTS")
    await controller.getProjects(ctx);
});

router.get('/:id', async (ctx) => {
    await controller.getProjectById(ctx);
})

router.del('/:id', async (ctx) => {
	await controller.deleteProjectById(ctx);
});

router.get('/:id/leave', async (ctx) => {
    await controller.leaveProjectById(ctx);
});

router.post('/', koaBody(), async (ctx) => {
	await controller.createProject(ctx);
});

router.put('/:id', koaBody(), async (ctx) => {
    await controller.updateProjectById(ctx);
});

router.get('/:id/sensorStreams', async (ctx) => {
    await controller.getProjectSensorStreams(ctx);
});

router.get('/:id/customMetaData', async (ctx) => {
    await controller.getProjectCustomMetaData(ctx);
});

module.exports = router