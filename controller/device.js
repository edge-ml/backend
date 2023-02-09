const Model = require("../models/device").model;
const Project = require("../models/project").model;
const Sensor = require("../models/sensor").model;
const SensorParseScheme = require("../models/sensorParseScheme").model;

/**
 * get all devices
 */
async function getDevices(ctx) {
  const devices = await Model.find({});
  ctx.body = devices;
  ctx.status = 200;
  return ctx;
}


async function getDeviceByNameAndGeneration(ctx) {
  const { name, generation } = ctx.params;
  const mainGeneration = generation.split(".")[0];
  const device = await Model.findOne({ name: name, generation: mainGeneration });
  if (!device) {
    ctx.body = { error: "Not found" };
    ctx.status = 404;
    return ctx;
  }
  const sensors = await Sensor.find({ device: device._id });
  ctx.status = 200;
  ctx.body = { device: device, sensors: sensors };
}

/**
 * create a new device
 */
async function createDevice(ctx) {
  const document = new Model(ctx.request.body);
  await document.save();
  ctx.body = document;
  ctx.status = 201;
  return ctx;
}

/**
 * update a device specified by id
 */
async function updateDeviceById(ctx) {
  await Model.findByIdAndUpdate(ctx.params.id, { $set: ctx.request.body });
  ctx.body = { message: `updated device with id: ${ctx.params.id}` };
  ctx.status = 200;
}



module.exports = {
  getDevices,
  getDeviceByNameAndGeneration,
  createDevice,
  updateDeviceById,
};
