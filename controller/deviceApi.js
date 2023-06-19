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

// Generates a random key and sets it
async function setApiKey(ctx) {
  const { authId } = ctx.state;
  const deviceApi = await DeviceApi.findOne({
    $and: [{ projectId: ctx.header.project }, { userId: authId }],
  });
  const readApiKey = crypto.randomBytes(16).toString("hex");
  const writeApiKey = crypto.randomBytes(16).toString("hex");
  if (deviceApi) {
    deviceApi.readApiKey = readApiKey;
    deviceApi.writeApiKey = writeApiKey;
    deviceApi.save();
  } else {
    const newDeviceApi = await DeviceApi({
      projectId: ctx.header.project,
      userId: authId,
      readApiKey: readApiKey,
      writeApiKey: writeApiKey,
    });
    await newDeviceApi.save();
  }

  ctx.status = 200;
  ctx.body = { readApiKey, writeApiKey };
  return ctx;
}

async function getApiKey(ctx) {
  const { authId } = ctx.state;
  const deviceApi = await DeviceApi.findOne({
    $and: [{ projectId: ctx.header.project }, { userId: authId }],
  });
  if (deviceApi) {
    ctx.body = { readApiKey: deviceApi.readApiKey, writeApiKey: deviceApi.writeApiKey };
    ctx.status = 200;
  } else {
    ctx.body = { readApiKey: undefined, writeApiKey: undefined };
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
