const mongoose = require("mongoose");

// import subdocuments
const TimeSeries = require("./timeSeries").model;
const FusedSeries = require("./fusedSeries").schema;
const LabelingObject = require("./datasetLabeling").schema;
const Video = require("./video").schema;
const Result = require("./result").schema;
const BSON = require("bson");

const Dataset = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: [true, "object needs to be associated with user"],
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
	start: {
		type: Number,
		required: [true, "please enter a start time"],
	},
	end: {
		type: Number,
		required: [true, "please enter an end time"],
	},
	isPublished: {
		type: Boolean,
		default: false,
	},
	timeSeries: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "TimeSeries",
		default: [],
	}],
	fusedSeries: {
		type: [FusedSeries],
		ref: "FusedSeries",
		default: [],
	},
	labelings: {
		type: [LabelingObject],
		ref: "DatasetLabeling",
		default: [],
	},
	video: {
		type: Video,
		ref: "Video"
	},
	device: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Device",
		default: null,
	},
	results: {
		type: [Result],
		ref: "Result",
		default: [],
	},
	experiments: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Experiment",
		default: null,
	},
	canEdit: {
		type: Boolean,
		default: true,
	},
	sizeInBytes: {
		type: Number,
		default: undefined
	}
});

Dataset.pre('validate', async function (next) {
	if (this.sizeInBytes === undefined && this.timeSeries && this.timeSeries.length > 0) {
		const timeSeries = await TimeSeries.find({ _id: { $in: this.timeSeries } }).lean();
		const size = BSON.calculateObjectSize(timeSeries) + BSON.calculateObjectSize(this);
		this.set({ sizeInBytes: size });
	}
	next();
})

module.exports = {
	model: mongoose.model("Dataset", Dataset),
	schema: Dataset,
};
