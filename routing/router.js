const Router = require('koa-router');

const prefixRouter =  new Router();
const router =  new Router();

// subroutes to be mounted
const subroutes = {
	users: require('./routes/user'),
	firmware: require('./routes/firmware'),
	device: require('./routes/device'),
	sensor: require('./routes/sensor'),
	projects: require('./routes/project'),
	deviceApi: require('./routes/deviceApi'),
	arduinoFirmware: require('./routes/arduinoFirmware')
};

// dataset routing
router.use('/users', subroutes.users.routes(), subroutes.users.allowedMethods());
router.use('/firmware', subroutes.firmware.routes(), subroutes.firmware.allowedMethods());
router.use('/devices', subroutes.device.routes(), subroutes.device.allowedMethods());
router.use('/sensors', subroutes.sensor.routes(), subroutes.sensor.allowedMethods());
router.use('/projects',  subroutes.projects.routes(), subroutes.projects.allowedMethods());
router.use('/deviceApi', subroutes.deviceApi.routes(), subroutes.deviceApi.allowedMethods());
router.use('/arduinoFirmware', subroutes.arduinoFirmware.routes(), subroutes.arduinoFirmware.allowedMethods());
prefixRouter.use('/api', router.routes(), router.allowedMethods());
module.exports = prefixRouter;
