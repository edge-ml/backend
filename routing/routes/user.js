const Router      = require('koa-router');
const KoaBody      = require('koa-body');

const controller = require('../../controller/user');

const router = new Router();

router.use(async (ctx, next) => {
    await validate_user_project()
})


/**
 * get all users
 * route:					/users
 * method type: 	GET
 */
router.get('/', KoaBody(),  async (ctx, next) => {
	await controller.getUsers(ctx, next);
});

/**
 * update user
 * route:					/users
 * method type: 	PUT
 */
router.put('/', KoaBody(), async (ctx) => {
	await controller.updateUser(ctx);
});



module.exports = router;
