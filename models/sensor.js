const mongoose = require("mongoose");

const Sensor = new mongoose.Schema({
  bleKey: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: Number,
    required: true,
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

Sensor.index({device: 1, name: 1}, {unique: true});

module.exports = {
  model: mongoose.model("Sensor", Sensor),
  schema: Sensor,
};
