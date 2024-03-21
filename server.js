const Koa = require("koa");
const config = require("./config");
const mongoose = require("mongoose");
const cors = require("koa-cors");
const koaSwagger = require("koa2-swagger-ui").koaSwagger;
const yamljs = require("yamljs");
const path = require("path");
const fs = require("fs");
const router = require("./routing/router.js");
const dbSchema = require("koa-mongoose-erd-generator");
const deviceManager = require("./createDevices");
const niclaDevice = require("./deviceSchemas/nicla").device;
const bleNanoDeivce = require("./deviceSchemas/bleNano").device;
const seeedDevice = require("./deviceSchemas/seeed").device;
const openEarable_v13 = require("./deviceSchemas/openEarable_v1.3.0.js").device;
const bleNanoV2 = require("./deviceSchemas/bleNanoV2.js").device;
const {MQ} = require("./messageBroker/publisher")

// create server
const server = new Koa();

// connect to Mongo
mongoose.connect(config.DATABASE_URI + config.DB_COLLECTION_BACKEND, {
  useNewUrlParser: true,
});

// Connect to RabbitMQ
console.log("Connecting to RabbitMQ...")
MQ.init()
  .then(() => console.log("Init RabiitMQ successful"))
  .catch((err) => {
    console.log("Could not connect to RabiitMQ.");
    process.exit(1);
  });

deviceManager
  .clearDevices()
  .then(() => {
    Promise.all(
      [deviceManager.addDevice(niclaDevice)],
      deviceManager.addDevice(bleNanoDeivce),
      deviceManager.addDevice(seeedDevice),
      deviceManager.addDevice(openEarable_v13),
      [deviceManager.addDevice(bleNanoV2)]
    ).then(() => {
      console.log("Added devices");
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit();
  });

// setup koa middlewares
server.use(cors());

// Serve documentation
server.use(
  dbSchema(
    "/api/docs/db",
    { modelsPath: __dirname + "/models", nameColor: "#007bff" },
    __dirname + "/docs/dbSchema.html"
  )
);

const spec = yamljs.load("./docs/docs.yaml");
server.use(
  koaSwagger({
    routePrefix: "/docs",
    title: "Explorer",
    swaggerOptions: { spec },
    favicon: "/api/docs/favicon.ico",
    hideTopbar: true,
  })
);

server.use((ctx, next) => {
  if (
    ctx.path == "/api/docs/favicon.ico" &&
    ctx.method == "GET" &&
    ctx.method != "Head"
  ) {
    ctx.body = fs.readFileSync(path.join(__dirname, "/docs/favicon.ico"));
    ctx.status = 200;
    return ctx;
  }
  return next();
});

// catch errors
server.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = error.status || 500;
  }
});

// routing
server.use(router.routes());

// catch all middleware, only land here
// if no other routing rules match
// make sure it is added after everything else
server.use((ctx) => {
  ctx.body = { error: "Not Found" };
  ctx.status = 404;
});

module.exports = server.listen(3001);
