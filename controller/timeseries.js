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

    var globalStart = Infinity;
    var globalEnd = undefined;

    const timeSeries = ctx.request.body;
    const timeSeriesId = timeSeries.map((elm) => {
      const start = Math.min(...elm.data.map((d) => d.timestamp));
      const end = Math.max(...elm.data.map((d) => d.timestamp));
      globalStart = globalStart ? Math.min(start, globalStart) : start;
      globalEnd = globalEnd ? Math.max(end, globalEnd) : end;
      return {
        data: elm.data,
        start: start,
        end: end,
        _id: dataset.timeSeries.find(
          (timeSeries) => timeSeries.name === elm.name
        )._id,
      };
    });

    // Assume all timeseris have the same timestamps
    //const minTime = Math.min(...timeSeries[0].data.map((d) => d.timestamp));
    //const maxTime = Math.max(...timeSeries[0].data.map((d) => d.timestamp));

    await Promise.all(
      timeSeriesId.map((elm) =>
        TimeSeriesModel.findOneAndUpdate(
          { _id: elm._id },
          {
            $push: { data: { $each: elm.data, $sort: { timestamp: 1 } } },
            $min: { start: elm.start },
            $max: { end: elm.end },
          }
        )
      )
    );
    await DatasetModel.findOneAndUpdate(
      { _id: ctx.params.datasetId },
      {
        $max: { end: globalEnd },
        $min: { start: globalStart },
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

async function getTimeSeriesMetaData(ctx) {
  const project = await ProjectModel.findOne({ _id: ctx.request.header.project });
  const dataset = await DatasetModel.findOne({_id: ctx.request.body.dataset});
  if (!project.datasets.includes(dataset._id)) {
    ctx.status = 400;
    ctx.body = {error: "No access"}
    return ctx;
  }
  const timeSeries = await TimeSeriesModel.find({_id: dataset.timeSeries})
  const res = timeSeries.map(elm => {
    console.log(elm.data.length)
    temp = Object.assign({}, elm.toObject())
    temp.dataLen = elm.data.length;
    temp.data = undefined
    return temp
  })
  ctx.status = 200;
  ctx.body = res;
}

module.exports = {
  appendData,
  getTimeSeriesMetaData
};
