const Router      = require('koa-router');
const multer      = require('@koa/multer');

const upload      = multer();

const controller = require('../../controller/CSVServices');

const router = new Router();

/**
 * processes CSV files uploaded by user
 * route:					/CSVServices
 * method type: 	POST
 */
// keep field name consistent with the frontend
router.post('/processCSV', upload.single('CSVFile'), async (ctx) => {
	await controller.processCSV(ctx);
});

module.exports = router;
