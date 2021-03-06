const Router      = require('koa-router');
const KoaBody      = require('koa-body');

const controller = require('../../controller/projects');

const router = new Router();

router.get('/', async (ctx) => {
    await controller.getProjects(ctx);
});

router.get('/:id', async (ctx) => {
    await controller.getProjectById(ctx);
})

router.del('/:id', async (ctx) => {
	await controller.deleteProjectById(ctx);
});

router.post('/', KoaBody(), async (ctx) => {
	await controller.createProject(ctx);
});

router.put('/:id', KoaBody(), async (ctx) => {
    await controller.updateProjectById(ctx);
});

router.get('/:id/sensorStreams', async (ctx) => {
    await controller.getProjectSensorStreams(ctx);
});

module.exports = router