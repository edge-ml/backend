const downsample = require('downsample');
const { findRange, readSegments } = require('./segmentService');

const DATAPOINT_CONFIG = {
	x: p => p.timestamp,
	y: p => p.datapoint,
	toPoint: (x, y) => ({ timestamp: x, datapoint: y })
};

const lttb = downsample.createLTTB(DATAPOINT_CONFIG);

const preview = (allTimeseries, resolutionString) => {
	if (resolutionString == null) {
		return allTimeseries;
	}
	const resolution = parseInt(resolutionString, 10);

	return allTimeseries.map((timeserie) => {
		// no need to downsample as the data is smaller tha our target
		if (timeserie.data.length <= resolution) {
			return timeserie;
		}

		return { _id: timeserie._id, data: lttb(timeserie.data, resolution) };
	});
};

const window = (dataset, allTimeseriesSegments, startString = null, endString = null) => {
	// no window at all
	if (startString == null && endString == null) {
		return Promise.all(allTimeseriesSegments.map(readSegments));
	}
	let start = parseInt(startString, 10);
	let end = parseInt(endString, 10);

	start = start == null ? dataset.start : start;
	end = end == null ? dataset.end : end;

	// dataset fully within our desired window
	if (start <= dataset.start && dataset.end <= end) {
		return Promise.all(allTimeseriesSegments.map(readSegments));
	}

	// filter in datapoints within desired window
	return Promise.all(allTimeseriesSegments.map(segments => findRange(segments, start, end)));
};

module.exports = {
	preview,
	window
};
