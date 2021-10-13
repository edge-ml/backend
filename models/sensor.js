const mongoose = require("mongoose");

const Sensor = new mongoose.Schema({
  bleKey: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true
  },
  typeName: {
    type: String,
    required: true,
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  parseScheme: {
    type: [
      {
        name: {
          type: String,
        },
        type: {
          type: String,
        },
        scaleFactor: {
          type: Number,
        },
        unit: {
          type: String,
        },
      },
    ],
    required: true,
  },
});

Sensor.index({ device: 1, name: 1 }, { unique: true });

module.exports = {
  model: mongoose.model("Sensor", Sensor),
  schema: Sensor,
};
