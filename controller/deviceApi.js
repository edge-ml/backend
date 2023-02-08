const Project = require("../models/project").model;
const crypto = require("crypto");
const Dataset = require("../models/dataset").model;
const DeviceApi = require("../models/deviceApi").model;
const TimeSeries = require("../models/timeSeries").model;
const Labeling = require("../models/labelDefinition").model;
const LabelType = require("../models/labelType").model;
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

/*
async function initDatasetIncrement(ctx) {
  try {
    const body = ctx.request.body;
    const deviceApi = await DeviceApi.findOne({
      deviceApiKey: body.deviceApiKey,
    });

    if (!body.name) {
      ctx.body = { error: "Wrong input parameters" };
      ctx.status = 400;
      return ctx;
    }

    if (!deviceApi) {
      ctx.body = { error: "Invalid key" };
      ctx.status = 403;
      return ctx;
    }
    const project = await Project.findOne(deviceApi.projectId);
    if (!project.enableDeviceApi) {
      ctx.body = { error: "This feature is disabled" };
      ctx.status = 403;
      return ctx;
    }

    const dataset = Dataset({
      name: body.name,
      metaData: body.metaData,
      userId: deviceApi.userId,
      start: 9999999999999,
      end: 0,
    });

    dataset.save();
    await Project.findByIdAndUpdate(deviceApi.projectId, {
      $push: { datasets: dataset._id },
    });

    const datasetKey = crypto.randomBytes(64).toString("base64");
    deviceApi.datasets.push({ dataset: dataset._id, datasetKey: datasetKey });
    await deviceApi.save();

    ctx.body = { datasetKey: datasetKey };
    ctx.status = 200;
    return ctx;
  } catch (e) {
    console.log(e);
  }
}

async function addDatasetIncrement(ctx) {
  try {
    const body = ctx.request.body;

    if (
      !"datasetKey" in body ||
      !"time" in body ||
      !"datapoint" in body ||
      !"sensorname" in body
    ) {
      ctx.status = 400;
      ctx.body = { error: "Wrong input parameters" };
      return ctx;
    }

    const { datasetKey, time, datapoint, sensorname } = body;
    const deviceApi = await DeviceApi.findOne({
      "datasets.datasetKey": datasetKey,
    });
    if (!deviceApi) {
      ctx.body = { error: "Invalid key" };
      ctx.status = 403;
      return ctx;
    }

    const datasetId = deviceApi.datasets.filter((elm) => {
      return elm.datasetKey === datasetKey;
    })[0].dataset;

    const newTimeSeries = await TimeSeries.findOneAndUpdate(
      {
        dataset: datasetId,
        name: sensorname,
      },
      {
        name: sensorname,
        $min: { start: time },
        $max: { end: time },
      },
      {
        upsert: true,
        new: true,
      }
    );
    await Dataset.findOneAndUpdate(
      {
        _id: datasetId,
      },
      {
        $addToSet: {
          timeSeries: newTimeSeries._id,
        },
      }
    );

    // Add datapoint
    await TimeSeries.findOneAndUpdate(
      { _id: newTimeSeries },
      {
        $push: {
          data: {
            timestamp: time,
            datapoint: datapoint,
          },
        },
      }
    );

    await Dataset.findOneAndUpdate(
      { _id: datasetId },
      {
        $max: { end: time },
        $min: { start: time },
      }
    );

    await TimeSeries.findOneAndUpdate(
      { _id: newTimeSeries },
      {
        $min: { start: time },
        $max: { end: time },
      }
    );
    ctx.status = 200;
    ctx.body = { message: "Added data" };
    return ctx;
  } catch (e) {
    ctx.status = 400;
    ctx.body = { error: "Error adding increment" };
  }
}

async function addDatasetIncrementIot(ctx) {
  try {
    const body = ctx.request.body;

    const sendObj = { datasetKey: body.datasetKey, data: [] };
    var idx = -1;
    for (var i = 0; i < body.data.length; i++) {
      const sensorData = body.data[i].split(";");

      if (!sendObj.data.some((e) => e.sensorname === sensorData[2])) {
        sendObj.data.push({
          sensorname: sensorData[2],
          start: sensorData[0],
          end: sensorData[0],
          timeSeriesData: [],
        });
        idx = sendObj.data.length - 1;
      } else {
        idx = sendObj.data.findIndex((x) => x.sensorname === sensorData[2]);
      }
      sendObj.data[idx].timeSeriesData.push({
        timestamp: sensorData[0],
        datapoint: sensorData[1],
      });
      if (sensorData[0] < sendObj.data[idx].start) {
        sendObj.data[idx].start = sensorData[0];
      }
      if (sensorData[0] > sendObj.data[idx].start) {
        sendObj.data[idx].end = sensorData[0];
      }
    }
    ctx.request.body = sendObj;
    await addDatasetIncrementBatch(ctx);
  } catch (e) {
    ctx.status = 500;
    ctx.body = { error: "Internal server error" };
  }
}

async function addDatasetIncrementBatch(ctx) {
  try {
    const body = ctx.request.body;
    const { datasetKey, data, datasetLabel } = body;
    const deviceApi = await DeviceApi.findOne({
      "datasets.datasetKey": datasetKey,
    });
    if (!deviceApi) {
      ctx.body = { error: "Invalid key" };
      ctx.status = 403;
      return ctx;
    }

    const datasetId = deviceApi.datasets.filter((elm) => {
      return elm.datasetKey === datasetKey;
    })[0].dataset;
    for (var i = 0; i < data.length; i++) {
      const sensorname = data[i].sensorname;
      const timeSeriesData = data[i].timeSeriesData;
      const startTime = data[i].start;
      const endTime = data[i].end;

      const newTimeSeries = await TimeSeries.findOneAndUpdate(
        {
          dataset: datasetId,
          name: sensorname,
        },
        {
          name: sensorname,
          start: 9999999999999,
          end: 0,
        },
        {
          upsert: true,
          new: true,
        }
      );
      await Dataset.findOneAndUpdate(
        {
          _id: datasetId,
        },
        {
          $addToSet: {
            timeSeries: newTimeSeries._id,
          },
        }
      );

      await TimeSeries.findOneAndUpdate(
        { _id: newTimeSeries },
        {
          $push: { data: { $each: timeSeriesData, $sort: { timestamp: 1 } } },
        }
      );
      await TimeSeries.findOneAndUpdate(
        { _id: newTimeSeries },
        {
          $min: { start: startTime },
          $max: { end: endTime },
        }
      );
    }
    ctx.globalStart = Math.min(...data.map((elm) => elm.start));
    ctx.globalEnd = Math.max(...data.map((elm) => elm.end));
    const dataset = await Dataset.findOneAndUpdate(
      { _id: datasetId },
      {
        $max: { end: ctx.globalEnd },
        $min: { start: ctx.globalStart },
      },
      { new: true, returnOriginal: true }
    );

    // Create a label for the whole dataset if needed

    // Create labeling if it does not exist
    if (datasetLabel) {
      const project = await ProjectModel.findOne({ _id: deviceApi.projectId });
      var [labelingName, labelName] = datasetLabel.split("_");
      var labeling = await Labeling.findOne({
        _id: project.labelDefinitions,
        name: labelingName,
      });
      if (!labeling) {
        labeling = await Labeling.create({ name: labelingName });
        await ProjectModel.findByIdAndUpdate(deviceApi.projectId, {
          $push: { labelDefinitions: labeling._id },
        });
      }

      var label = await LabelType.findOne({
        _id: labeling.labels,
        name: labelName,
      });
      if (!label) {
        label = await LabelType.create({
          name: labelName,
          color: generateRandomColor(),
        });
        await Labeling.findByIdAndUpdate(labeling._id, {
          $push: { labels: label._id },
        });
        await ProjectModel.findByIdAndUpdate(deviceApi.projectId, {
          $push: { labelTypes: label._id },
        });
      }

      // Label the dataset
      await Dataset.findOneAndUpdate(
        { _id: datasetId },
        {
          labelings: [
            {
              labelingId: labeling._id,
              labels: [
                { type: label._id, start: dataset.start, end: dataset.end },
              ],
            },
          ],
        }
      );
    }

    ctx.status = 200;
    ctx.body = { message: "Added data" };
    return ctx;
  } catch (e) {
    console.log(e);
    ctx.status = 400;
    ctx.body = { error: "Error adding increment" };
  }
}

async function uploadDataset(ctx) {
  try {
    const body = ctx.request.body.payload;
    const key = ctx.request.body.key;

    const deviceApi = await DeviceApi.findOne({
      deviceApiKey: key,
    });
    if (!deviceApi) {
      ctx.body = { error: "Invalid key" };
      ctx.status = 403;
      return ctx;
    }
    const project = await Project.findOne(deviceApi.projectId);
    if (!project || !project.enableDeviceApi) {
      ctx.body = { error: "This feature is disabled" };
      ctx.status = 403;
      return ctx;
    }

    body.userId = deviceApi.userId;
    const document = new Dataset(body);
    await document.save();
    await Project.findByIdAndUpdate(
      { _id: project._id },
      {
        $push: { datasets: document._id },
      }
    );

    ctx.body = { message: "Generated dataset" };
    ctx.status = 200;
    return ctx;
  } catch (e) {
    ctx.status = 400;
    ctx.body = { error: "Error creating the dataset" };
    return ctx;
  }
}

async function getProject(ctx) {
  try {
    const key = ctx.request.body.key;

    const deviceApi = await DeviceApi.findOne({
      deviceApiKey: key,
    });

    if (!deviceApi) {
      ctx.body = { error: "Invalid key." };
      ctx.status = 403;
      return ctx;
    }

    const project = await Project.findOne(deviceApi.projectId);
    if (!project.enableDeviceApi) {
      ctx.body = { error: "Can not get project because API is not enabled." };
      ctx.status = 403;
      return ctx;
    }

    const datasets = await Dataset.find({ _id: project.datasets }).populate(
      "timeSeries"
    );

    ctx.body = {
      datasets: await Promise.all(
        datasets.map(async (x) => {
          const tmpLabels = await Promise.all(
            x.labelings.map(async (a) => {
              const labeling = await Labeling.findOne({ _id: a.labelingId });
              return await Promise.all(
                a.labels.map(async (b) => {
                  console.log(b.type);
                  labelName = (await LabelType.findOne({ _id: b.type })).name;
                  return {
                    labelingName: labeling.name,
                    name: labelName,
                    start: b.start,
                    end: b.end,
                  };
                })
              );
            })
          );
          return {
            sensors: x.timeSeries.map((y) => {
              return {
                name: y.name,
                data: y.data.map((z) => {
                  return { timestamp: z.timestamp, datapoint: z.datapoint };
                }),
              };
            }),
            labels: tmpLabels,
            metaData: x.metaData
          };
        })
      ),
    };

    ctx.status = 200;
    return ctx;
  } catch (e) {
    console.log(e);
    ctx.status = 400;
    ctx.body = { error: "Failed to retrieve project." };
    return ctx;
  }
}*/

module.exports = {
  setApiKey,
  removeKey,
  // uploadDataset,
  switchActive,
  getApiKey,
  // initDatasetIncrement,
  // addDatasetIncrement,
  // addDatasetIncrementBatch,
  // addDatasetIncrementIot,
  // getProject,
};
