const mongoose = require('mongoose');
const { deleteSegment } = require('../utils/segmentService');


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
		size: {type: Number, required: [true, 'size must be specified']},
		resolution: {type: Number, required: [true, 'size must be specified']},
		lastUpdated: { type: Number, default: 0 },
		segments: [{
			start: { type: Number, default: 0 },
			end: { type: Number, default: 0 },
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

TimeSeries.pre('deleteMany', async function (next) {
	// remove gridfs segments related to the timeseries here
	const query = this.getQuery()
	const timeSeries = (await model.find(query).select('levels')).map((ts) => ts.levels);
	const segmentIds = timeSeries.flatMap(ts => ts.flatMap(level => level.segments.map(s => s.segmentId)));
	for (const _id of segmentIds) {
		deleteSegment(_id);
	}
	next();
});


const model = mongoose.model('TimeSeries', TimeSeries);

module.exports = {
	model: model,
	schema: TimeSeries,
};
