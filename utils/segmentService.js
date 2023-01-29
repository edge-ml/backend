const gridFS = require('mongoose-gridfs');
const mongoose = require('mongoose');
const timsort = require('timsort');
const { Readable } = require('stream');

let bucket;

const DEFAULT_SOFT_SEGMENT_SIZE = 10000;
const SYNC_CHECKPOINT_EVERY_N_DATAPOINT = 1;

mongoose.connection.once('open', () => {
	bucket = gridFS.createBucket();
});

const timestampCompare = (a, b) => a.timestamp - b.timestamp;
const startCompare = (a, b) => a.start - b.start;

const deleteGridFSFile = async _id => new Promise((res, rej) => {
	bucket.deleteFile(_id, (err, results) => {
		if (err) rej(err);
		res(results);
	});
});

const bufferToGridFS = (buffer, _id) => new Promise((resolve, reject) => {
	const readable = new Readable();
	readable.push(buffer);
	readable.push(null);
	const filename = _id.toString();
	bucket.writeFile({ filename, _id }, readable, (error, file) => {
		if (error) reject(error);
		resolve(file);
	});
});
const gridFSToBuffer = (_id) => {
	const stream = bucket.readFile({ _id });
	const chunks = [];
	return new Promise((resolve, reject) => {
		stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
		stream.on('error', err => reject(err));
		stream.on('end', () => resolve(Buffer.concat(chunks).toString()));
	});
};

const chunkToBuffer = chunk => Buffer.from(JSON.stringify(
	chunk.map(({ timestamp, datapoint }) => [timestamp, datapoint])
));
const bufferToChunk = buffer => JSON.parse(buffer.toString())
	.map(([timestamp, datapoint]) => ({ timestamp, datapoint }));

// takes a predicate mapping { timestamp, datapoint }-based predicates to chunk mapping
// we still use above format in the front, so not needed now
const chunkFilterPredicateFactory = predicate => predicate;

const createSingleSegment = async (chunk) => {
	// const sortedChunk = timsort.sort(chunk, timestampCompare);
	const sortedChunk = chunk.sort(timestampCompare);

	const _id = new mongoose.Types.ObjectId();

	await bufferToGridFS(chunkToBuffer(sortedChunk), _id);

	return {
		start: sortedChunk[0].timestamp,
		end: sortedChunk[sortedChunk.length - 1].timestamp,
		count: sortedChunk.length,
		segmentId: _id,
	};
};

const createSegmentsFromTimeseriesData = async (data, {
	segmentSize = DEFAULT_SOFT_SEGMENT_SIZE
} = {}) => {
	let segments = [];

	let nextSync = SYNC_CHECKPOINT_EVERY_N_DATAPOINT;
	for (let i = 0; i < data.length; i += segmentSize) {
		const chunk = data.slice(i, i + segmentSize);

		if (i > nextSync) {
			// sync every so often so that we don't cause a surge on the memory
			// console.log('sync', i)
			nextSync = i + SYNC_CHECKPOINT_EVERY_N_DATAPOINT;
			await Promise.all(segments);
		}

		segments.push(createSingleSegment(chunk));
	}

	segments = await Promise.all(segments);

	return segments.sort(startCompare);
};

const readSegment = async segment => bufferToChunk(await gridFSToBuffer(segment.segmentId));
const readSegments = async segments => (await Promise.all(segments.map(readSegment))).flat();

// return: [target segment (-1 if none), prevsegment (-1 if none), nextsegment (array.len if none)]
const binarySearch = (array, targetCmpFn) => {
	let left = 0;
	let right = array.length - 1;

	while (left <= right) {
		const middle = Math.floor((left + right) / 2);

		if (targetCmpFn(array[middle]) === 0) { return [middle, middle - 1, middle + 1]; }

		if (targetCmpFn(array[middle]) < 0) { // target < middle
			right = middle - 1;
		} else {
			left = middle + 1;
		}
	}

	// right and left swapped places, prev is now right, next is left, and the target is (must be,) in between
	return [-1, right, left];
};

const targetCmpFnFactory = (target, targetField) => (seg) => {
	if (seg.start <= target && target <= seg.end) {
		return 0;
	}

	return target - seg[targetField];
};

const findSegment = (segments, timestamp) => {
	const [target, prev, next] = binarySearch(segments, targetCmpFnFactory(timestamp, 'start'));
	return { target, prev, next };
};

const findSegmentedRange = (segments, start, end) => {
	const [startSegmentIdx, prevStart, ns] = binarySearch(segments, targetCmpFnFactory(start, 'start'));
	const [endSegmentIdx, pe, nextEnd] = binarySearch(segments, targetCmpFnFactory(end, 'end'));

	const startSlice = startSegmentIdx !== -1 ? startSegmentIdx : prevStart;
	const endSlice = endSegmentIdx !== -1 ? endSegmentIdx : nextEnd;

	return segments.slice(startSlice, endSlice + 1);
};

const findRange = async (segments, start, end) => {
	const selected = await Promise.all(
		findSegmentedRange(segments, start, end)
			.map(readSegment)
	);

	if (selected.length === 0) {
		// no segments in range
		return [];
	}

	if (selected.length === 1) {
		// single segment contains both start and end
		return selected[0]
			.filter(chunkFilterPredicateFactory(a => start <= a.timestamp && a.timestamp <= end));
	}

	const fi = selected[0]
		.filter(chunkFilterPredicateFactory(a => start <= a.timestamp));
	const la = selected[selected.length - 1]
		.filter(chunkFilterPredicateFactory(a => a.timestamp <= end));
	const rest = selected.slice(1, -1);

	return [fi, ...rest, la].flat();
};

module.exports = {
	createSegmentsFromTimeseriesData,
	findRange,
	readSegment,
	readSegments,
	findSegment,
};
