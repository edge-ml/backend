const mongoose = require("mongoose");

const SensorParseSchema = new mongoose.Schema({
  type: {
    type: String,
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


module.exports = {
  model: mongoose.model("SensorParseSchema", SensorParseSchema),
  schema: SensorParseSchema,
};
