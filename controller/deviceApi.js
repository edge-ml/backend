const Project = require("../models/project").model;
const crypto = require("crypto");
const DeviceApi = require("../models/deviceApi").model;
const ProjectModel = require("../models/project").model;

const { generateRandomColor } = require("../utils/colorService");

async function switchActive(ctx) {
  const { authId } = ctx.state;
  const body = ctx.request.body;
  const project = await Project.findOne({
    $and: [{ _id: ctx.header.project }, { admin: authId }],
  });

  if (!project) {
    ctx.body = { error: "No access to this project" };
    ctx.status = 400;
    return ctx;
  }

  project.enableDeviceApi = body.state;
  await project.save();
  ctx.body = {
    message: "DeviceApi for project " + project._id + ": " + body.state,
  };
  ctx.status = 200;
  return ctx;
}


async function setApiKey(ctx) {
  console.log("set key")
  const { authId } = ctx.state;
  const deviceApi = await DeviceApi.findOne({
    $and: [{ projectId: ctx.header.project }, { userId: authId }],
  });
  const deviceKey = crypto.randomBytes(16).toString("hex");
  if (deviceApi) {
    deviceApi.deviceApiKey = deviceKey;
    deviceApi.save();
  } else {
    const newDeviceApi = await DeviceApi({
      projectId: ctx.header.project,
      userId: authId,
      deviceApiKey: deviceKey,
    });
    await newDeviceApi.save();
  }

  ctx.status = 200;
  ctx.body = { deviceApiKey: deviceKey };
  return ctx;
}

async function getApiKey(ctx) {
  const { authId } = ctx.state;
  const deviceApi = await DeviceApi.findOne({
    $and: [{ projectId: ctx.header.project }, { userId: authId }],
  });
  console.log(deviceApi)
  if (deviceApi) {
    ctx.body = { deviceApiKey: deviceApi.deviceApiKey };
    ctx.status = 200;
  } else {
    ctx.body = { deviceApiKey: undefined };
    ctx.status = 200;
  }
  return ctx;
}

async function removeKey(ctx) {
  const { authId } = ctx.state;
  const deviceApi = await DeviceApi.findOne({
    $and: [{ projectId: ctx.header.project }, { userId: authId }],
  });

  if (!deviceApi) {
    ctx.body = { error: "No access to this project" };
    ctx.status = 400;
    return ctx;
  }

  deviceApi.remove();
  ctx.body = { message: "Disabled device api" };
  ctx.status = 200;
  return ctx;
}

module.exports = {
  setApiKey,
  removeKey,
  switchActive,
  getApiKey,
};
