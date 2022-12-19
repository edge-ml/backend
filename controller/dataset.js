const Model = require("../models/dataset").model;
const UserModel = require("../models/user").model;
const Experiment = require("../models/experiment").model;
const DatasetLabeling = require("../models/datasetLabeling").model;
const DatasetLabel = require("../models/datasetLabel").model;
const ProjectModel = require("../models/project").model;
const DeviceApi = require("../models/deviceApi").model;
const TimeSeries = require("../models/timeSeries").model;
const FSModel = require('../models/timeSeries').FSModel;
const Readable = require('stream').Readable;
const gridFS = require('mongoose-gridfs');

const mongoose = require("mongoose");

// let TimeSeriesModel;
let bucket;

mongoose.connection.once('open', () => {
  // bucket = gridFS.createBucket({bucketName: 'TimeSeries'})
  // console.log('creating');
  // TimeSeriesModel = gridFS.createModel({ modelName: 'TimeSeries' });
  bucket = gridFS.createBucket();
})


function createTimeSeriesFilename(_id, name) {
  return 'tsid:' + _id + '::' + 'name:' + name;
}

function extractNameFromFilename(name) {
  return name.match(/name:(.*)(::|)/)[1];
}

function isNumber(val) {
  return /^-?[\d.]+(?:e-?\d+)?$/.test(val);
};

function generateRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

async function processCSV(ctx) {
  const files = ctx.request.files;
  const timeData = [];
  for (const file of files) {
    const res = file.buffer.toString('utf-8');
    const allTextLines = res.split(/\r\n|\n/);
    if (allTextLines[allTextLines.length - 1] === '') {
      allTextLines.pop();
    }
    const lines = [];
    for (let i = 0; i < allTextLines.length; i++) {
      const data = allTextLines[i].replace(/\s/g, '').split(',');
      lines.push(data);
    }
    timeData.push(lines);
    if (timeData.length === files.length) {
      ctx.body = timeData;
      ctx.status = 200;
    }
  }
}

function checkHeaders(timeData) {
  const errors = [];
  for (var i = 0; i < timeData.length; i++) {
    const currentErrors = [];
    const header = timeData[i][0];
    if (header[0] !== 'time') {
      currentErrors.push({ error: "Header must start with 'time'" });
      errors.push(currentErrors);
      continue;
    }
    for (var j = 1; j < header.length; j++) {
      if (
        !/label_.+_.+/gm.test(header[j]) &&
        !/sensor_[^\[\]]+(\[.*\])?/gm.test(header[j])
      ) {
        currentErrors.push({
          error: `Wrong header format in colum ${j + 1}`,
        });
      }
    }
    if (currentErrors.length) {
      errors.push(currentErrors);
    }
  }
  return errors;
}

function extractTimeSeries(timeData, i) {
  const timeSeries = {
    name: timeData[0][i].replace('sensor_', '').split('[')[0],
    unit: /\[(.*)\]/.test(timeData[0][i])
      ? timeData[0][i].match(/\[(.*)\]/).pop()
      : '',
    end: parseInt(timeData[timeData.length - 1][0], 10),
    start: parseInt(timeData[1][0], 10),
    data: [],
  };
  for (var j = 1; j < timeData.length; j++) {
    if (timeData[j][0] === '') {
      throw { error: `Timestamp missing in row ${j + 1}` };
    }
    if (!isNumber(timeData[j][0])) {
      throw { error: `Timestamp is not a number in row ${j + 1}` };
    }
    if (timeData[j][i] === '') {
      continue;
    }
    if (!isNumber(timeData[j][i])) {
      throw {
        error: `Sensor value is not a number in row ${j + 1}, column ${i + 1}`,
      };
    }
    timeSeries.data.push({
      timestamp: parseInt(timeData[j][0], 10),
      datapoint: parseFloat(timeData[j][i]),
    });
  }
  return timeSeries;
}

function extractLabel(timeData, i) {
  const labelNames = [];

  const labelingName = timeData[0][i].split('_')[1];
  const labelName = timeData[0][i].split('_')[2];

  const labeling = {
    name: labelingName,
  };

  const labels = [
    {
      name: labelName,
      color: generateRandomColor(),
      isNewLabel: true,
    },
  ];

  const datasetLabel = {
    name: labelingName,
    labels: [],
  };

  for (var j = 1; j < timeData.length; j++) {
    if (timeData[j][i] !== '') {
      var start = timeData[j][0];
      while (j < timeData.length && '' !== timeData[j][i]) {
        j++;
      }
      datasetLabel.labels.push({
        start: start,
        end: timeData[j - 1][0],
        name: labelName,
      });
      j--;
    }
  }
  return { datasetLabel: datasetLabel, labeling: labeling, labels: labels };
}

function processCSVColumn(timeData) {
  try {
    const timeSeries = [];
    const labelings = [];
    const numDatasets = timeData[0].length - 1;
    if (numDatasets === 0) {
      throw { error: 'No data in csv file' };
    }
    for (var i = 1; i <= numDatasets; i++) {
      const csvLength = timeData[0].length;
      const csvLenghError = timeData.findIndex(
        (elm) => elm.length !== csvLength
      );
      if (csvLenghError > 0) {
        throw {
          error: `Each row needs the same number of elements, at line ${
            csvLenghError + 1
          }`,
        };
      }
      if (timeData.length < 2) {
        throw { error: 'No data in csv file' };
      }
      if (timeData[0][i].startsWith('sensor_')) {
        timeSeries.push(extractTimeSeries(timeData, i));
      } else if (timeData[0][i].startsWith('label_')) {
        labelings.push(extractLabel(timeData, i));
      } else {
        throw { error: 'Wrong format' };
      }
    }

    const uniquelabelingNames = new Set(
      labelings.map((elm) => elm.labeling.name)
    );
    const resultingLabelings = [];
    uniquelabelingNames.forEach((labelingName) => {
      const labelingToAppend = {
        datasetLabel: { name: labelingName, labels: [] },
        labeling: { name: labelingName },
        labels: [],
      };
      labelingToAppend.labels.push(
        ...labelings
          .filter((elm) => elm.labeling.name === labelingName)
          .map((data) => data.labels)
          .flat(1)
      );
      labelingToAppend.datasetLabel.labels = labelings
        .filter((elm) => elm.labeling.name === labelingName)
        .map((data) => data.datasetLabel.labels)
        .flat(1);
      resultingLabelings.push(labelingToAppend);
    });

    const result = {
      start: timeSeries[0].start,
      end: parseInt(timeData[timeData.length - 1][0], 10),
      timeSeries: timeSeries,
    };
    return { dataset: result, labeling: resultingLabelings };
  } catch (err) {
    console.log('process CSV column error')
    console.log(err)
    return [{ error: err }];
  }
}

async function generateDataset(ctx) {
  // original method takes timeData and dataset as parameters
  const timeData = ctx.request.body;
  console.log(timeData);
  const headerErrors = checkHeaders(timeData);
  if (headerErrors.some((elm) => elm.length > 0)) {
    ctx.body = headerErrors;
    ctx.status = 400;
    return;
  }
  const datasets = [];
  const labelings = [];
  const errors = [];
  for (var i = 0; i < timeData.length; i++) {
    const dataset = processCSVColumn(timeData[i]);
    console.log('processed dataset')
    console.log(dataset)
    if (!Array.isArray(dataset)) {
      datasets.push(dataset.dataset);
      labelings.push(dataset.labeling);
      errors.push([]);
      console.log('error found in if')
    } else {
      console.log('error found in else')
      errors.push(dataset);
    }
  }
  console.log(errors);
  if (errors.some((elm) => elm.length > 0)) {
    ctx.body = errors;
    console.log(errors)
    ctx.status = 418;
    return;
  }
  console.log('returning from generate dataset');
  ctx.body = { datasets: datasets, labelings: labelings };
  ctx.status = 200;
}

/**
 * Util Function
 * Create labelings from experiment
 */
async function autoCreateLabelings(dataset) {
  const experiment = await Experiment.findById(dataset.experiments);
  const datasetLabeling = new DatasetLabeling({
    labelingId: experiment,
    labels: [],
  });
  let { start } = dataset;
  let end;
  for (let i = 0; i < experiment.instructions.length; i++) {
    end = start + experiment.instructions[i].duration;
    const datasetLabel = new DatasetLabel({
      name: `autogenerated datasetLabel ${i}`,
      type: experiment.instructions[i].labelType,
      start,
      end,
    });
    start = end;
    await datasetLabel.save();
    datasetLabeling.labels.push(datasetLabel);
    i++;
  }
  await datasetLabeling.save();
  return datasetLabeling;
}

/**
 * get all datasets
 */
async function getDatasets(ctx) {
  const projectId = ctx.header.project;
  const project = await ProjectModel.findOne({ _id: projectId });
  const datasets = await Model.find({ _id: project.datasets });
  ctx.body = datasets;
  ctx.status = 200;
}

function streamToJSON(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
  })
}

async function populateTimeSeries(dataset) {
  const timeseriesPopulation = [];
  const newDataset = []
  for (const [i, ds] of dataset.entries()) {
    timeseriesPopulation.push([]);
    for (const ts of ds.timeSeries) {
      const readStream = bucket.readFile({ _id: ts });
      const data = await streamToJSON(readStream);
      timeseriesPopulation[i].push(data);
    }
  }
  for (let i = 0; i < dataset.length; i++) {
    const newDs = JSON.parse(JSON.stringify(dataset[i]));
    newDs.timeSeries = timeseriesPopulation[i]
    newDataset.push(newDs)
  }
  // console.log('updated')
  // console.log(newDataset)
  return newDataset;
}

async function populateTimeSeriesNames(datasets) {
  const timeseriesNames = []; // TODO: maybe use set here
  for (const [i, ds] of datasets.entries()) {
    for (const ts of ds.timeSeries) {
      const file = await bucket.findById(ts);
      timeseriesNames.push(extractNameFromFilename(file.filename));
    }
  }
  return timeseriesNames;
}

/**
 * get dataset by id
 */
async function getDatasetById(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  var dataset = undefined;
  if (ctx.request.query.onlyMetaData) {
    dataset = await Model.find({
      $and: [{ _id: ctx.params.id }, { _id: project.datasets }],
    });
  } else {
    console.log('jo')
    dataset = await Model.find({
      $and: [{ _id: ctx.params.id }, { _id: project.datasets }],
    }).exec();
  }

  // populate timeseries manually using gridfs

  dataset = await populateTimeSeries(dataset);

  if (dataset.length === 1) {
    ctx.body = dataset[0];
    ctx.status = 200;
  } else {
    ctx.body = { error: "Dataset not in requested project" };
    ctx.status = 400;
  }
  return ctx.body;
}

/**
 * get dataset lock by id
 */
async function getDatasetLockById(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  const lock = await Model.find({
    $and: [{ _id: ctx.params.id }, { _id: project.datasets }],
  })
    .select("canEdit")
    .exec();
  if (lock.length === 1) {
    ctx.body = { canEdit: lock[0].canEdit };
    ctx.status = 200;
  } else {
    ctx.body = { error: "Dataset not in requested project" };
    ctx.status = 400;
  }
  return ctx.body;
}

/**
 * create a new dataset
 */
async function createDataset(ctx) {
  const dataset = ctx.request.body;
  dataset.projectId = ctx.header.project;
  // if userId empty, set it to requesting user
  if (!dataset.userId) {
    const { authId } = ctx.state;
    const user = await UserModel.findOne({ authId });
    dataset.userId = user._id;
  }

  if (
    "experiments" in dataset &&
    dataset.experiments !== null &&
    !("labelings" in dataset)
  ) {
    dataset.labelings = await autoCreateLabelings(dataset);
  } else if (
    "experiments" in dataset &&
    dataset.experiments !== null &&
    "labelings" in dataset &&
    dataset.labelings.length > 0
  ) {
    ctx.body = { error: "Do not set experiment and labelings" };
    ctx.status = 400;
    return ctx;
  }

  const document = new Model({ ...dataset, timeSeries: undefined });
  await document.save();

  console.log(Buffer.byteLength(JSON.stringify(dataset.timeSeries)));

  for (var i = 0; i < dataset.timeSeries.length; i++) {
    const _id = new mongoose.Types.ObjectId();
    const readable = new Readable();
    console.log('before upload')
    dataset.timeSeries[i].offset = 0;
    const buf = Buffer.from(JSON.stringify(dataset.timeSeries[i]));
    readable.push(buf);
    readable.push(null);
    const filename = createTimeSeriesFilename(_id, dataset.timeSeries[i].name);
    bucket.writeFile({ filename, _id }, readable, (error, file) => {
      // console.log(file);
    });
    // TimeSeriesBucket.writeFile({ filename }, readStream, (error, file) => { console.log('done') });
    // const writeStream = TimeSeriesBucket.writeFile({ filename }, readStream);
    document.timeSeries.push(_id);
  }

  const resultSave = await document.save();

  await ProjectModel.findByIdAndUpdate(ctx.header.project, {
    $push: { datasets: document._id },
  });

  ctx.body = document;
  ctx.status = 201;
  return ctx;
}

async function updateDatasetById(ctx) {
  try {
    const dataset = ctx.request.body;
    const project = await ProjectModel.findOne({ _id: ctx.header.project });
    var timeSeries = undefined;
    if (project.datasets.includes(ctx.params.id)) {
      if (dataset.timeSeries) {
        timeSeries = await Promise.all(
          dataset.timeSeries.map((elm) => {
            if (elm._id) {
              return TimeSeries.findByIdAndUpdate(elm._id, elm);
            } else {
              elm.dataset = ctx.params.id;
              return TimeSeries.create(elm);
            }
          })
        );
        dataset.timeSeries = timeSeries.map((elm) => elm._id);
      }
      await Model.findByIdAndUpdate(ctx.params.id, dataset);
      ctx.body = { message: `updated dataset with id: ${ctx.params.id}` };
      ctx.status = 200;
    } else {
      ctx.body = { error: "Forbidden" };
      ctx.status = 403;
    }
    return ctx;
  } catch (e) {
    console.log(e);
  }
}

async function canEditDatasetById(ctx) { // we could use the update method above, but it sends the whole dataset, which is unnecessarily SLOW
  try {
    const { canEdit } = ctx.request.body;
    const project = await ProjectModel.findOne({ _id: ctx.header.project });
    if (project.datasets.includes(ctx.params.id)) {
      await Model.findByIdAndUpdate(ctx.params.id, {
        $set: { canEdit: canEdit }
      });
      ctx.body = { message: `changed canEdit for dataset with id: ${ctx.params.id}` };
      ctx.status = 200;
    } else {
      ctx.body = { error: "Forbidden" };
      ctx.status = 403;
    }
    return ctx;
  } catch (e) {
    console.log(e);
  }
}

/**
 * delete a dataset specified by id
 */
async function deleteDatasetById(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  const dataset = await Model.findOneAndDelete({
    $and: [{ _id: ctx.params.id }, { _id: project.datasets }],
  });
  if (dataset !== null) {
    await ProjectModel.updateOne(
      { _id: ctx.header.project },
      { $pull: { datasets: ctx.params.id } }
    );

    await TimeSeries.deleteMany({ _id: { $in: dataset.timeSeries } });

    await DeviceApi.updateMany(
      { projectId: project._id },
      { $pull: { datasets: { dataset: ctx.params.id } } }
    );

    ctx.body = { message: `deleted dataset with id: ${ctx.params.id}` };
    ctx.status = 200;
  } else {
    ctx.body = { error: "Dataset not found" };
    ctx.status = 400;
  }
  return ctx;
}

module.exports = {
  getDatasets,
  getDatasetById,
  getDatasetLockById,
  createDataset,
  updateDatasetById,
  canEditDatasetById,
  deleteDatasetById,
  populateTimeSeriesNames,
  processCSV,
  generateDataset
};
