const mongoose = require("mongoose");

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

TimeSeries.virtual('compSamplingRate').get(function() {
  if (this.samplingRate) {
    return this.samplingRate
  }
  const times = this.data.slice(0, 50).map(elm => elm.timestamp);
  const diffs = []
  for (var i = 1; i < times.length; i++) {
    diffs.push(times[i] - times[i - 1])
  }
  const average = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const samplingRate = 1000 / average;
  return samplingRate;
  
})

module.exports = {
  model: mongoose.model("TimeSeries", TimeSeries),
  schema: TimeSeries,
};
