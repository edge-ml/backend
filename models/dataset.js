const mongoose = require("mongoose");

// import subdocumets
const TimeSeries = require("./timeSeries").schema;
const FusedSeries = require("./fusedSeries").schema;
const LabelingObject = require("./datasetLabeling").schema;
const Video = require("./video").schema;
const Result = require("./result").schema;

const Dataset = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: [true, "Dataset needs to be associated with user"],
	},
	projectId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Project",
		required: [true, "Datasets needs to be associated with a project"]
	},
	metaData: {
		type: Map,
		of: String,
		default: {}
	},
	name: {
		type: String,
		required: [true, "Dataset needs a name"]
	},
	timeSeries: {
		type: [mongoose.Schema.Types.ObjectId],
		default: []
	},
	labelings: {
		type: [LabelingObject],
		ref: "DatasetLabeling",
		default: [],
	},
	canEdit: {
		type: Boolean,
		default: true,
	},
});

module.exports = {
	model: mongoose.model("Dataset", Dataset),
	schema: Dataset,
};
