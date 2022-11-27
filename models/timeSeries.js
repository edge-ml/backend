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

TimeSeries.post("find", function (result) {
  try {
    result.forEach(ts => {
      console.log("PRE")
      const times = ts.data.map(elm => elm.timestamp)
      const diffs = []
      for (var i = 1; i < times.length; i++) {
        diffs.push(times[i] - times[i - 1])
      }
      const average = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const sampleRate = 1000 / average;
      console.log(ts.name, ": ", sampleRate)
    })
  } catch (err) {
    console.log(err)
  }
})

module.exports = {
  model: mongoose.model("TimeSeries", TimeSeries),
  schema: TimeSeries,
};
