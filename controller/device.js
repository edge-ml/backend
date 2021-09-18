const Model = require("../models/device").model;
const Project = require("../models/project").model;
const Datasets = require("../models/dataset").model;
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

/**
 * get device by id
 */
async function getDeviceById(ctx) {

  const deviceData = await Model.findOne({ _id: ctx.params.id });
  const sensors = await Sensor.find({device: ctx.params.id });
  const parseScheme = await SensorParseScheme.find({});
  console.log(sensors)
  if (deviceData !== null) {
    ctx.body = {device: deviceData, sensors: sensors, scheme: parseScheme};
    ctx.status = 200;
  } else {
    ctx.body = { error: "Not found" };
    ctx.status = 404;
  }
  return ctx;
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

/**
 * delete all devices
 */
async function deleteDevices(ctx) {
  /*const project = await Project.findById({ _id: ctx.header.project });
  await Datasets.updateMany(
    { device: project.datasets },
    { $pull: { devices: project.devices } }
  );
  await Model.deleteMany({ _id: ctx.header.project });
  await Project.updateOne(
    { _id: ctx.header.project },
    { $set: { devices: [] } }
  );
  ctx.body = { message: "deleted all devices" };
  ctx.status = 200;
  return ctx;*/
}

/**
 * delete a device specified by id
 */
async function deleteDeviceById(ctx) {
  /*const project = await Project.findById({ _id: ctx.header.project });
  await Datasets.updateMany(
    { device: project.datasets },
    { $pull: { devices: ctx.params.id } }
  );
  await Project.updateOne(
    { _id: ctx.header.project },
    { $pull: { devices: ctx.params.id } }
  );
  await Model.findOneAndDelete({ _id: ctx.params.id });
  ctx.body = { message: `deleted device with id: ${ctx.params.id}` };
  ctx.status = 200;
  return ctx;*/

  

}

module.exports = {
  getDevices,
  getDeviceById,
  createDevice,
  updateDeviceById,
  deleteDevices,
  deleteDeviceById,
};
