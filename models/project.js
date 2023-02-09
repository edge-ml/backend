const mongoose = require("mongoose");
const Device = require("./device").model;
const Sensor = require("./sensor").model;
const Firmware = require("./firmware").model;

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
  enableDeviceApi: {
    type: Boolean,
    default: false,
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
  await Firmware.deleteMany({ _id: { $in: this.firmware } });
  await DeviceApi.deleteMany({ projectId: this._id });
  next();
});

module.exports = {
  model: mongoose.model("Project", Project),
  schema: Project,
};
