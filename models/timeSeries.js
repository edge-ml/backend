const mongoose = require('mongoose');

const TimeSeries = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'timeSeries name cannot be empty'],
	},
	dataset: {
		type: mongoose.Schema.Types.ObjectId,
		required: [true, 'timeSeries must be in a dataset']
	},
	unit: {
		type: String,
		default: '',
	},
	levels: [{
		resolution: {type: Number, required: [true, 'resolution must be specified']},
		lastUpdated: { type: Number, default: 0 },
		segments: [{
			start: { type: Number, default: 0 },
			end: { type: Number, default: 0 },
			count: { type: Number, default: 0 },
			segmentId: {
				type: mongoose.Schema.Types.ObjectId,
				required: [true, 'each segment in a mip level needs to be coupled to a file']
			}
		}]
	}],
	offset: {
		type: Number,
		default: 0,
	},
	start: { type: Number, default: 0 },
	end: { type: Number, default: 0 },
	samplingRate: Number,
});

TimeSeries.pre('deleteMany', () => {
	// remove gridfs segments related to the timeseries here
	throw new Error('Not Implemented'); // TODO FIXME
});

module.exports = {
	model: mongoose.model('TimeSeries', TimeSeries),
	schema: TimeSeries,
};
