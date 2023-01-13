const gridFS = require('mongoose-gridfs');
const mongoose = require('mongoose');
const timsort = require('timsort');
const { Readable } = require('stream');

let bucket;

const DEFAULT_SOFT_SEGMENT_SIZE = 100;

mongoose.connection.once('open', () => {
	bucket = gridFS.createBucket();
});

const timestampCompare = (a, b) => a.timestamp - b.timestamp;
const startCompare = (a, b) => a.start - b.start;

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

const createSegmentsFromTimeseriesData = async (data, {
	segmentSize = DEFAULT_SOFT_SEGMENT_SIZE
} = {}) => {
	const segments = [];
	const promises = [];

	for (let i = 0; i < data.length; i += segmentSize) {
		const chunk = data.slice(i, i + segmentSize);

		// const sortedChunk = timsort.sort(chunk, timestampCompare);
		const sortedChunk = chunk.sort(timestampCompare);

		const _id = new mongoose.Types.ObjectId();

		promises.push(bufferToGridFS(chunkToBuffer(sortedChunk), _id).then(() => {
			segments.push({
				start: sortedChunk[0].timestamp,
				end: sortedChunk[sortedChunk.length - 1].timestamp,
				segmentId: _id,
			});
		}));
	}

	await Promise.all(promises);

	return segments.sort(startCompare);
};

module.exports = {
	createSegmentsFromTimeseriesData,
};
