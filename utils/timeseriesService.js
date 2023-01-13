const downsample = require('downsample');

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

// this method is slow, but we don't have any windowing operation
// from the underlying layer (mongodb, or gridfs), so it is the best we
// can do without (pre)caching.
const window = (dataset, allTimeseries, startString = null, endString = null) => {
	// no window at all
	if (startString == null && endString == null) {
		return allTimeseries;
	}
	let start = parseInt(startString, 10);
	let end = parseInt(endString, 10);

	start = start == null ? dataset.start : start;
	end = end == null ? dataset.end : end;

	// dataset fully within our desired window
	if (start <= dataset.start && dataset.end <= end) {
		return allTimeseries;
	}

	// filter in datapoints within desired window
	const filter = p => start <= p.timestamp && p.timestamp <= end;
	return allTimeseries.map(timeserie => ({
		_id: timeserie._id, data: timeserie.data.filter(filter)
	}));
};

module.exports = {
	preview,
	window
};
