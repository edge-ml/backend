const table = require("table").table;
const mongoose = require("mongoose");
const Datasets = require("./models/dataset").model;
const TimeSeries = require("./models/timeSeries").model;
const Projects = require("./models/project").model;
const LabelDefinitions = require("./models/labelDefinition").model;
const Labels = require("./models/labelType").model;

const config = require("config");

const avg = (arr) => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

const table_data = [];

(async () => {
  await mongoose.connect(config.db, { useNewUrlParser: true });

  const numProjects = await Projects.count({});
  table_data.push(["#Projects", numProjects]);

  const numDatasets = await Datasets.count({});
  table_data.push(["#Datasets", numDatasets]);

  const numTimeSeries = await TimeSeries.count({});
  table_data.push(["#TimeSeries", numTimeSeries]);
  const timeSeries_length = (await TimeSeries.find({}, "data")).map(
    (elm) => elm.data.length
  )
  table_data.push(["Max TimeSeries_length", Math.max(...timeSeries_length)])
  table_data.push(["Min TimeSeries_length", Math.min(...timeSeries_length)])
  table_data.push(["Avg TimeSeries_length", Math.ceil(avg(timeSeries_length))])

  const numLabelDefinitions = await LabelDefinitions.count({});
  table_data.push(["#Labelings", numLabelDefinitions]);

  const numLabels = await Labels.count({});
  table_data.push(["#Labels", numLabels]);

  const dataset_labelings = (await Datasets.find({}, "labelings"))
    .map((elm) => elm.labelings)
    .map((elm) => elm.map((d) => d.labels.length))
    .flat()
    .reduce((p, v) => p + v, 0);
  table_data.push(["#Labels on datasets", dataset_labelings]);

  const dataset_noLabels = (await Datasets.find({}, "labelings"))
    .map((elm) => elm.labelings)
    .filter((elm) => !elm.length).length;
  console.log(dataset_noLabels);
  table_data.push(["#Datasets with no labels", dataset_noLabels]);

  console.log(table(table_data));
  process.exit();
})();
