const DatasetModel = require("../models/dataset").model;
const ProjectModel = require("../models/project").model;
const TimeSeriesModel = require("../models/timeSeries").model;

async function appendData(ctx) {
  try {
    const project = await ProjectModel.findOne({ _id: ctx.header.project });
    const dataset = await DatasetModel.findOne({
      $and: [{ _id: ctx.params.datasetId }, { _id: project.datasets }],
    })
      .populate("timeSeries")
      .exec();
    if (!project || !dataset) {
      ctx.body = { error: "Forbidden" };
      ctx.status = 403;
      return ctx;
    }

    const timeSeries = ctx.request.body;
    const timeSeriesId = timeSeries.map((elm) => {
      return {
        data: elm.data,
        _id: dataset.timeSeries.find(
          (timeSeries) => timeSeries.name === elm.name
        )._id,
      };
    });

    // Assume all timeseris have the same timestamps
    const minTime = Math.min(...timeSeries[0].data.map((d) => d.timestamp));
    const maxTime = Math.max(...timeSeries[0].data.map((d) => d.timestamp));

    await Promise.all(
      timeSeriesId.map((elm) =>
        TimeSeriesModel.findOneAndUpdate(
          { _id: elm._id },
          {
            $push: { data: { $each: elm.data, $sort: { timestamp: 1 } } },
            $min: { start: minTime },
            $max: { end: maxTime },
          }
        )
      )
    );
    await DatasetModel.findOneAndUpdate(
      { _id: ctx.params.datasetId },
      {
        $max: { end: maxTime },
        $min: { start: minTime },
      }
    );

    ctx.status = 200;
    ctx.body = { message: "This is fine" };
    return ctx;
  } catch (e) {
    console.log(e);
    ctx.status = 500;
    ctx.body = { error: "Internal server error" };
  }
}

module.exports = {
  appendData,
};
