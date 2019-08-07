const mongoose = require('mongoose');

// import subdocumets
const Event = require('./event').schema;
const TimeSeries = require('./timeSeries').schema;
const FusedSeries = require('./fusedSeries').schema;
const LabelingObject = require('./labelingObject').schema;
const Video = require('./video').schema;
const Device = require('./device').schema;
const Result = require('./result').schema;

const Dataset = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'object needs to be associated with user']
	},
	start: {
		type: Number,
		required: [true, 'please enter a start time']
	},
	end: {
		type: Number,
		required: [true, 'please enter an end time'],
		validate: [
			function () {
				return this.start < this.end;
			},
			'End time cannot be before start time'
		]
	},
	events: {
		type: [Event],
		default: []
	},
	isPublished: {
		type: Boolean,
		default: false
	},
	timeSeries: {
		type: [TimeSeries],
		default: []
	},
	fusedSeries: {
		type: [FusedSeries],
		default: []
	},
	labelings: {
		type: [LabelingObject],
		default: []
	},
	video: Video,
	device: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Device',
		required: [true, 'device needs to be defined']
	},
	results: {
		type: [Result],
		default: []
	}
});

module.exports = {
	model: mongoose.model('Dataset', Dataset),
	schema: Dataset
};
