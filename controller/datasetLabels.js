const Dataset = require("../models/dataset").model;
const Labeling = require("../models/labelDefinition").model;
const ProjectModel = require("../models/project").model;
const util = require("util");

module.exports.createLabel = async (ctx) => {
  const { datasetId, labelingId } = ctx.params;
  const label = ctx.request.body;

  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  const labelingExists = await Labeling.exists({
    $and: [{ _id: labelingId }, { _id: project.labelDefinitions }],
  });
  if (!labelingExists) {
    ctx.status = 400;
    ctx.body = { message: "A labeling with this id does not exist" };
  }

  await Dataset.findOneAndUpdate(
    {
      $and: [
        { _id: datasetId },
        { _id: project.datasets },
        { "labelings.labelingId": { $ne: labelingId } },
      ],
    },
    { $push: { labelings: { labels: [], labelingId: labelingId } } }
  );

  // Adds label to labeling in dataset
  const result = await Dataset.findOneAndUpdate(
    {
      $and: [
        { _id: datasetId },
        { _id: project.datasets },
        { "labelings.labelingId": labelingId },
      ],
    },
    {
      $push: {
        "labelings.$.labels": label,
      },
    },
    {
      new: true,
      projection: {
        labelings: {
          $elemMatch: { labelingId: labelingId },
        },
      },
    }
  );
  ctx.status = 200;
  ctx.body = result.labelings[0].labels.at(-1);
  return ctx;
};

module.exports.changeLabel = async (ctx) => {
  const { datasetId, labelingId } = ctx.params;
  const label = ctx.request.body;

  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  const dataset = await Dataset.findOne({
    $and: [{ _id: datasetId }, { _id: project.datasets }],
  });
  const labelingIdx = dataset.labelings.findIndex((elm) =>
    elm.labelingId.equals(labelingId)
  );
  if (labelingIdx < 0) {
    ctx.status = 500;
    ctx.body = { error: "Label not in dataset" };
    return ctx;
  }
  var labelIdx = dataset.labelings[labelingIdx].labels.findIndex((elm) =>
    elm._id.equals(label._id)
  );
  if (labelIdx < 0) {
    ctx.status = 500;
    ctx.body = { error: "Label not in dataset" };
    return ctx;
  }
  dataset.labelings[labelingIdx].labels[labelIdx] = label;
  dataset.save();

  ctx.status = 200;
  return ctx;
};

module.exports.deleteLabel = async (ctx) => {
  const { datasetId, labelingId, labelId } = ctx.params;
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  const dataset = await Dataset.findOne({
    $and: [{ _id: datasetId }, { _id: project.datasets }],
  });
  const labelingIdx = dataset.labelings.findIndex((elm) =>
    elm.labelingId.equals(labelingId)
  );
  if (labelingIdx < 0) {
    ctx.status = 500;
    ctx.body = { error: "Label not in dataset" };
    return ctx;
  }
  var labelIdx = dataset.labelings[labelingIdx].labels.findIndex((elm) =>
    elm._id.equals(labelId)
  );
  if (labelIdx < 0) {
    ctx.status = 500;
    ctx.body = { error: "Label not in dataset" };
    return ctx;
  }
  dataset.labelings[labelingIdx].labels.splice(labelIdx, 1);
  dataset.save();

  ctx.status = 200;
  return ctx;
};
