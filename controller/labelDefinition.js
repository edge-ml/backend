const project = require("../models/project");
const Model = require("../models/labelDefinition").model;
const LabelModel = require("../models/labelType").model;
const ProjectModel = require("../models/project").model;
const DatasetModel = require("../models/dataset").model;

/**
 * get all labelDefinitions
 */
async function getLabelDefinitions(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  const labelDefinitions = await Model.find({ _id: project.labelDefinitions });
  const labelTypes = await LabelModel.find({ _id: project.labelTypes });
  ctx.body = { labelDefinitions: labelDefinitions, labelTypes: labelTypes };
  ctx.status = 200;
  return ctx;
}

/**
 * get labelDefinition by id
 */
async function getLabelDefinitionById(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  const labelDefinitions = await Model.find({
    $and: [{ _id: ctx.params.id }, { _id: project.labelDefinitions }],
  });
  if (labelDefinitions.length === 1) {
    ctx.body = labelDefinitions[0];
    ctx.status = 200;
  } else {
    ctx.body = { error: "Labeldefinition not in project" };
    ctx.body = 400;
  }
  ctx.status = 200;
  return ctx;
}

/**
 * create a new labelDefinition
 */
async function createLabelDefinition(ctx) {
  try {
    var document;
    if (
      ctx.request.body.labels &&
      ctx.request.body.labels.every((elm) => typeof elm === "object")
    ) {
      const project = await ProjectModel.findOne({ _id: ctx.header.project });
      const Labeling = await Model.findOne({
        $and: [
          { name: ctx.request.body.name },
          { _id: project.labelDefinitions },
        ],
      }).populate("labels");
      if (Labeling) {
        const compareLabels = Labeling.labels.map((elm) => elm.name);
        const newLabels = ctx.request.body.labels.filter(
          (elm) => !compareLabels.includes(elm.name)
        );
        const labels = await LabelModel.insertMany(newLabels);
        const labelIds = labels.map((elm) => elm._id);
        await Model.updateOne(
          { _id: Labeling._id },
          { $push: { labels: labelIds } }
        );
        await ProjectModel.findByIdAndUpdate(ctx.header.project, {
          $push: { labelTypes: labelIds },
        });
      } else {
        const labels = await LabelModel.insertMany(ctx.request.body.labels);
        ctx.request.body.labels = undefined;
        const labelIds = labels.map((elm) => elm._id);
        document = new Model({ ...ctx.request.body, labels: labelIds });
        await ProjectModel.findByIdAndUpdate(ctx.header.project, {
          $push: { labelTypes: labelIds },
        });
        await document.save();
        await ProjectModel.findByIdAndUpdate(ctx.header.project, {
          $push: { labelDefinitions: document._id },
        });
      }
    } else {
      document = new Model(ctx.request.body);
      await ProjectModel.findByIdAndUpdate(ctx.header.project, {
        $push: { labelDefinitions: document._id },
      });
    }

    ctx.body = document;
    ctx.status = 201;
    return ctx;
  } catch (e) {
    console.log(e);
    ctx.body = { error: e };
    ctx.status = 500;
    return ctx;
  }
}

/**
 * update a labelDefinition specified by id
 */
async function updateLabelDefinitionById(ctx) {
  try {
    const { labeling, labels } = ctx.request.body;
    const project = await ProjectModel.findOne({ _id: ctx.header.project });
    if (project.labelDefinitions.includes(ctx.params.id)) {
      const newLabeling = await Model.findByIdAndUpdate(
        ctx.params.id,
        { $set: labeling },
        { new: true }
      )
        .populate("labels")
        .exec();
      const newLabels = {};
      newLabeling.labels.forEach((elm) => {
        newLabels[elm._id] = elm.name;
      });
      labels.forEach((elm) => {
        newLabels[elm._id] = elm.name;
      });
      const newLabelNames = Object.values(newLabels);
      if (new Set(newLabelNames).size != newLabelNames.length) {
        ctx.body = { error: "Labels must have unique names in a labeling" };
        ctx.status = 400;
        return ctx;
      }
      await Promise.all(
        labels.map((elm) => LabelModel.findOneAndUpdate({ _id: elm._id }, elm))
      );

      ctx.body = {
        message: `updated labelDefinition with id: ${ctx.params.id}`,
      };
      ctx.status = 200;
    } else {
      ctx.body = { error: "Forbidden" };
      ctx.status = 403;
    }
    return ctx;
  } catch (e) {
    console.log(e);
    ctx.body = { error: "Internal server error" };
    ctx.status = 500;
    return ctx;
  }
}

/**
 * delete all labelDefinitions
 */
async function deleteLabelDefinitions(ctx) {
  await Model.deleteMany({});
  ctx.body = { message: "deleted all labelDefinitions" };
  ctx.status = 200;
  return ctx;
}

/**
 * delete a labelDefinition specified by id
 */
async function deleteLabelDefinitionById(ctx) {
  try {
    const project = await ProjectModel.findOne({ _id: ctx.header.project });
    if (project.labelDefinitions.includes(ctx.params.id)) {
      const labelDefinition = await Model.findOne({ _id: ctx.params.id });
      const result = await DatasetModel.updateMany(
        { _id: project.datasets },
        {
          $pull: { labelings: { labelingId: ctx.params.id } },
        }
      );

      // delete labelTypes first
      labelDefinition.labels.forEach(async (label) => {
        await LabelModel.findOneAndDelete({ _id: label._id });
      });
      const newProjectLabelTypes = project.labelTypes.filter(
        (item) => !labelDefinition.labels.includes(item)
      );
      const labelDefinitions = project.labelDefinitions.filter(
        (item) => String(item) !== String(ctx.params.id)
      );
      // delete labelDefinition
      await Model.findOneAndDelete({ _id: ctx.params.id });
      await ProjectModel.findByIdAndUpdate(ctx.header.project, {
        $set: {
          labelTypes: newProjectLabelTypes,
          labelDefinitions: labelDefinitions,
        },
      });
      ctx.body = {
        message: `deleted labelDefinition with id: ${ctx.params.id}`,
      };
      ctx.status = 200;
    } else {
      ctx.body = { error: "Forbidden" };
      ctx.status = 403;

      return ctx;
    }
  } catch (e) {
    ctx.status = 500;
    ctx.body = { error: "Internal server error" };
    return ctx;
  }
}

async function addLabelTypes(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.header.project });
  if (project.labelDefinitions.includes(ctx.params.id)) {
    const existingLabelNames = (await Model.find({ _id: ctx.params.id })).map(
      (elm) => elm.name
    );
    if (
      existingLabelNames.length + ctx.request.body.length !=
      new Set([
        ...ctx.request.body.map((elm) => elm.name),
        ...existingLabelNames,
      ]).size
    ) {
      ctx.body = { error: "Labels must have unique names in a labeling" };
      ctx.status = 400;
      return ctx;
    }
    const labelTypes = await LabelModel.insertMany(ctx.request.body);
    const labelIds = labelTypes.map((elm) => elm._id);
    await ProjectModel.findByIdAndUpdate(ctx.header.project, {
      $push: { labelTypes: labelIds },
    });
    await Model.findByIdAndUpdate(ctx.params.id, {
      $push: { labels: labelIds },
    });
    ctx.body = { message: "Added labelTypes" };
    ctx.status = 200;
  } else {
    ctx.body = { error: "Forbidden" };
    ctx.status = 403;
  }
  return ctx;
}

async function deleteLabelTypes(ctx) {
  try {
    const project = await ProjectModel.findOne({ _id: ctx.header.project });
    if (project.labelDefinitions.includes(ctx.params.id)) {
      const result = await DatasetModel.updateMany(
        { _id: project.datasets },
        {
          $pull: {
            "labelings.$[].labels": { type: { $in: ctx.request.body } },
          },
        }
      );
      const labelTypes = await LabelModel.deleteMany({ _id: ctx.request.body });
      await ProjectModel.findByIdAndUpdate(ctx.header.project, {
        $pull: { labelTypes: { $in: ctx.request.body } },
      });
      await Model.findByIdAndUpdate(ctx.params.id, {
        $pull: { labels: { $in: ctx.request.body } },
      });
      ctx.body = { message: "Added labelTypes" };
      ctx.status = 200;
    } else {
      ctx.body = { error: "Forbidden" };
      ctx.status = 403;
    }
    return ctx;
  } catch (e) {
    ctx.status = 500;
    ctx.body = { error: "Internal server error" };
    return ctx;
  }
}

module.exports = {
  getLabelDefinitions,
  getLabelDefinitionById,
  createLabelDefinition,
  updateLabelDefinitionById,
  deleteLabelDefinitions,
  deleteLabelDefinitionById,
  addLabelTypes,
  deleteLabelTypes,
};
