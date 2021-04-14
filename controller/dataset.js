const Model = require("../models/dataset").model;
const UserModel = require("../models/user").model;
const Experiment = require("../models/experiment").model;
const DatasetLabeling = require("../models/datasetLabeling").model;
const DatasetLabel = require("../models/datasetLabel").model;
const ProjectModel = require("../models/project").model;

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

/**
 * get dataset by id
 */
async function getDatasetById(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  const dataset = await Model.find({
    $and: [{ _id: ctx.params.id }, { _id: project.datasets }],
  });
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

  const document = new Model(dataset);
  await document.save();
  await ProjectModel.findByIdAndUpdate(ctx.header.project, {
    $push: { datasets: document._id },
  });

  ctx.body = document;
  ctx.status = 201;
  return ctx;
}

/**
 * update a dataset specified by id
 */
async function updateDatasetById(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  if (project.datasets.includes(ctx.params.id)) {
    await Model.findByIdAndUpdate(ctx.params.id, { $set: ctx.request.body });
    ctx.body = { message: `updated dataset with id: ${ctx.params.id}` };
    ctx.status = 200;
  } else {
    ctx.body = { error: "Forbidden" };
    ctx.status = 403;
  }
  return ctx;
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
    const newDatasets = project.datasets.filter(
      (item) => String(item) !== String(ctx.params.id)
    );
    await ProjectModel.findByIdAndUpdate(ctx.header.project, {
      $set: { datasets: newDatasets },
    });
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
  createDataset,
  updateDatasetById,
  deleteDatasetById
};
