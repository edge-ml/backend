const Model = require("../models/dataset").model;
const UserModel = require("../models/user").model;
const Experiment = require("../models/experiment").model;
const DatasetLabeling = require("../models/datasetLabeling").model;
const DatasetLabel = require("../models/datasetLabel").model;
const ProjectModel = require("../models/project").model;
const DeviceApi = require("../models/deviceApi").model;
const TimeSeries = require("../models/timeSeries").model;
const mongoose = require("mongoose");
const timeSeries = require("../models/timeSeries");
const ObjectId = mongoose.Types.ObjectId;
const {addTimeSeriesBatch, deleteTimeSeries } = require("./timeSeriesDataAdapter");


/**
 * get all datasets
 */
async function getDatasets(ctx) {
  console.log("Getting all datasets");
  const projectId = ctx.header.project;
  const datasets = await Model.find({ projectId: projectId });
  ctx.body = datasets;
  ctx.status = 200;
}

/**
 * get dataset by id
 */
/*
async function getDatasetById(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  var dataset = undefined;
  if (ctx.request.query.onlyMetaData) {
    dataset = await Model.find({
      $and: [{ _id: ctx.params.id }, { _id: project.datasets }],
    });
  } else {
    dataset = await Model.find({
      $and: [{ _id: ctx.params.id }, { _id: project.datasets }],
    })
      .populate("timeSeries", "-data") // don't send actual data with metadata anymore
      .lean()
      .exec();
  }
  if (dataset.length === 1) {
    ctx.body = dataset[0];
    ctx.status = 200;
  } else {
    ctx.body = { error: "Dataset not in requested project" };
    ctx.status = 400;
  }
  return ctx.body;
}*/
async function getDatasetById(ctx) {
  console.log("Get dataset by id");
  console.log(ctx.params.id)
  console.log(ctx.header.project)
  const dataset = await Model.findOne({ _id: ObjectId(ctx.params.id), projectId: ObjectId(ctx.header.project) });
  console.log(dataset)
  if (dataset) {
    console.log("Return datasets")
    ctx.body = dataset;
    ctx.status = 200;
    return ctx;
  }
  ctx.body = { error: "Dataset not found" };
  ctx.steatus = 400;
  return ctx;
}

async function getDatasetLockById(ctx) {
  const lock = await Model.find({ _id: ctx.params.id }).select("canEdit").exec();
  if (lock.length === 1) {
    ctx.body = { anEdit: lock[0].canEdit };
    ctx.status = 200;
  }
}


/**
 * get dataset lock by id
 */
/*
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
}*/

/**
 * create a new dataset
 */
// async function createDataset(ctx) {
//   try {
//     console.log("creating dataset")
//     const dataset = ctx.request.body;
//     dataset.projectId = ctx.header.project;
//     // if userId empty, set it to requesting user
//     if (!dataset.userId) {
//       const { authId } = ctx.state;
//       const user = await UserModel.findOne({ authId });
//       dataset.userId = user._id;
//     }

//     // Insert the timeSeries
//     await insertTimeSeriesBatch(dataset.timeSeries, dataset)

//     const datasetDoc = await Model.create(dataset);
//     print(datasetDoc)

//     await ProjectModel.findByIdAndUpdate(ctx.header.project, {
//       $push: { datasets: document._id },
//     });

//     ctx.body = document;
//     ctx.status = 201;
//     return ctx;
//   } catch (e) {
//     console.log(e)
//   }
// }

async function createDataset(ctx) {
  try {
    console.log("Creating dataset")
    const dataset = ctx.request.body;
    dataset.projectId = ctx.header.project;
    if (!dataset.userId) {
      const { authId } = ctx.state;
      const user = await UserModel.findOne({ authId });
      dataset.userId = user._id;
    }

    const datasetTimeSeries = dataset.timeSeries;

    // Create objectIds for each timeSeries
    dataset.timeSeries = dataset.timeSeries.map(elm => new mongoose.Types.ObjectId());

    // Create the dataset
    const newDataset = await Model.create(dataset);

    // use the TSSTORE to save the new timeSeries
    datasetTimeSeries.forEach(function (_, index, _) {
      datasetTimeSeries[index]._id = dataset.timeSeries[index];
    });


    console.log("invoking ts data add");
    await addTimeSeriesBatch(datasetTimeSeries);

    ctx.body = newDataset;
    ctx.status = 201;
    return ctx;
  } catch (e) {
    console.log(e)
  }
}

async function updateDatasetById(ctx) {
  const dataset = ctx.request.body;
  await Model.findByIdAndUpdate({ $and: [{ _id: ctx.params.id }, { _id: project.datasets }] }, dataset);
  ctx.body = { message: `updated dataset with id: ${ctx.params.id}` };
  ctx.status = 200;
}

/*
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
*/

async function canEditDatasetById(ctx) {
  const canEdit = ctx.request.body.canEdit;
  const projectId = ctx.header.project;
  await Model.findByIdAndUpdate(ctx.params.id, { $set: { canEdit: canEdit } })
  ctx.body = { message: `changed canEdit for dataset with id: ${ctx.params.id}` };
  ctx.status = 200;
}

/*
async function canEditDatasetById(ctx) { // we could use the update method above, but it sends the whole dataset, which is unnecessarily SLOW
  try {
    const { canEdit } = ctx.request.body;
    const projectId = ctx.header.project;
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
}*/

/**
 * delete a dataset specified by id
 */
/*
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
*/

async function deleteDatasetById(ctx) {
  try {
    console.log("Delete")
    console.log(ctx.params.id)
    console.log(ctx.header.project)
    const dataset = await Model.findOneAndDelete({ $and: [{ _id: ObjectId(ctx.params.id) }, { projectId: ObjectId(ctx.header.project) }] });
    if (dataset === null) {
      ctx.body = { error: "Dataset not found" };
      ctx.status = 400;
      return ctx;
    }
    await Promise.all(dataset.timeSeries.map(id => deleteTimeSeries(id)));
    ctx.body = { message: `deleted dataset with id: ${ctx.params.id}` };
    ctx.status = 200;
    return ctx;
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  getDatasets,
  getDatasetById,
  getDatasetLockById,
  createDataset,
  updateDatasetById,
  canEditDatasetById,
  deleteDatasetById,
};
