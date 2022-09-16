const mongoose = require("mongoose");
const Dataset = require("./dataset").model;
const Experiment = require("./experiment").model;
const LabelDefinition = require("./labelDefinition").model;
const LabelType = require("./labelType").model;
const Device = require("./device").model;
const Service = require("./service").model;
const Sensor = require("./sensor").model;
const Firmware = require("./firmware").model;
const DeviceApi = require("./deviceApi").model;
const BSON = require("bson");

const featureLevels = {
  standard: 'standard', 
  upgraded: 'upgraded', 
  unlimited: 'unlimited'
}
const featureLevelSizeLimit = (featureLevel) => {
  switch (featureLevel) {
    case featureLevels.standard: return 2147483648      // 2 GB in bytes
    case featureLevels.upgraded: return 10737418240     // 10 GB in bytes
    case featureLevels.unlimited: return 10995116277760 // 10 TB in bytes
    default: throw 'Invalid feature level'
  }
}

const Project = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "a project needs an admin"],
  },
  name: {
    type: String,
    required: [true, "a project needs a name"],
  },
  users: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  datasets: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Dataset",
    default: [],
  },
  experiments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Experiment",
    default: [],
  },
  labelDefinitions: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "LabelDefinition",
    default: [],
  },
  labelTypes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "LabelType",
    default: [],
  },
  devices: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Device",
    default: [],
  },
  services: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Service",
    default: [],
  },
  sensors: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Sensor",
    default: [],
  },
  firmware: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Firmware",
    default: [],
  },
  enableDeviceApi: {
    type: Boolean,
    default: false,
  },
  featureLevel: {
		type: String,
		enum: [featureLevels.standard, featureLevels.upgraded, featureLevels.unlimited],
		default: featureLevels.standard
	},
  usedStorage: {
    type: Number,
    default: 0,
  }
});

Project.index({ name: 1, admin: 1 }, { unique: true });

const regex = new RegExp("/W");
Project.path("name").validate(
  (value) => /^[\w, -]+$/.test(value),
  "Invalid project name"
);

Project.pre("validate", function (next) {
  if (this.users.includes(this.admin)) {
    next(new Error("Admin cannot be a user of the project"));
  }
  if (new Set(this.users.map(elm => elm.toString())).size !== this.users.length) {
    next(new Error("Users must be unique"));
  }
  next();
})

Project.pre("remove", async function (next) {
  await Dataset.deleteMany({ _id: { $in: this.datasets } });
  await Experiment.deleteMany({ _id: { $in: this.experiments } });
  await LabelDefinition.deleteMany({ _id: { $in: this.labelDefinitions } });
  await LabelType.deleteMany({ _id: { $in: this.labelTypes } });
  await Device.deleteMany({ _id: { $in: this.devices } });
  await Service.deleteMany({ _id: { $in: this.services } });
  await Sensor.deleteMany({ _id: { $in: this.sensors } });
  await Firmware.deleteMany({ _id: { $in: this.firmware } });
  await DeviceApi.deleteMany({ projectId: this._id });
  next();
});


Project.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const projectDoc = await this.model.findOne(this.getQuery());
  let changeInSize = 0;
  if (this._update['$push'] && this._update['$push']['datasets']) {
    changeInSize = (await Dataset.findOne({ _id: this._update['$push']['datasets'] })).sizeInBytes;
  } else if (this._update['$pull'] && this._update['$pull']['datasets']) {
    changeInSize = -(await Dataset.findOne({ _id: this._update['$pull']['datasets'] })).sizeInBytes;
  }
  console.log('changeInSize', changeInSize);
  if (changeInSize > 0 && projectDoc.usedStorage + changeInSize > featureLevelSizeLimit(projectDoc.featureLevel)) {
    console.log('Storage limit is exceeded!')
    return next(new Error("Storage limit is exceeded!"));
  }
  next();
})

Project.post(["findOneAndUpdate", "updateOne"], async function () {
  const projectDoc = await this.model.findOne(this.getQuery());
  const datasets = await Dataset.find({ _id: { $in: projectDoc.datasets } });
  const datasetsSize = datasets.reduce((total, dataset) => total + dataset.sizeInBytes, 0)
  const experiments = BSON.calculateObjectSize(await Experiment.find({ _id: { $in: projectDoc.experiments } }));
  const labelDefinitions = BSON.calculateObjectSize(await LabelDefinition.find({ _id: { $in: projectDoc.labelDefinitions } }));
  const labelTypes = BSON.calculateObjectSize(await LabelType.find({ _id: { $in: projectDoc.labelTypes } }));
  const devices = BSON.calculateObjectSize(await Device.find({ _id: { $in: projectDoc.devices } }));
  const services = BSON.calculateObjectSize(await Service.find({ _id: { $in: projectDoc.services } }));
  const sensors = BSON.calculateObjectSize(await Sensor.find({ _id: { $in: projectDoc.sensors } }));
  const firmwares = BSON.calculateObjectSize(await Firmware.find({ _id: { $in: projectDoc.firmware } }));
  const deviceApis = BSON.calculateObjectSize(await DeviceApi.find({ projectId: projectDoc._id }));
  const size = datasetsSize + experiments + labelDefinitions + labelTypes + devices + services + sensors + firmwares + deviceApis;
  projectDoc.usedStorage = size;
  await projectDoc.save();
})



module.exports = {
  model: mongoose.model("Project", Project),
  schema: Project,
};
