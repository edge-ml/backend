const mongoose = require("mongoose");
const gridFS = require('mongoose-gridfs');

// let bucket;


const TimeSeries = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "timeSeries name cannot be empty"],
  },
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "timeSeries must be in a dataset"]
  },
  unit: {
    type: String,
    default: "",
  },
  data: {
    type: [
      {
        timestamp: {
          type: Number,
          required: [true, "invalid timestamp"],
        },
        datapoint: {
          type: Number,
          required: [true, "invalid datapoint"],
        },
      },
    ],
  },
  offset: {
    type: Number,
    default: 0,
  },
  start: { type: Number, default: 0 },
  end: { type: Number, default: 0 },
  samplingRate: Number,
});

module.exports = {
  model: mongoose.model("TimeSeries", TimeSeries),
  // bucket: bucket,
  // FSModel: TimeSeriesModel,
  schema: TimeSeries,
};
