const downsample = require('downsample');

const DatasetModel = require('../models/dataset').model;
const ProjectModel = require('../models/project').model;
const TimeSeriesModel = require('../models/timeSeries').model;

const { findRange, readSegments, createSegmentsFromTimeseriesData } = require('../utils/segmentService');

const ENABLE_MIPMAPPING = true;
const ENABLE_POST_WINDOW_DOWNSAMPLE = true;
const MIP_STEP = 4;

const DATAPOINT_CONFIG = {
	x: p => p.timestamp,
	y: p => p.datapoint,
	toPoint: (x, y) => ({ timestamp: x, datapoint: y })
};

const lttb = downsample.createLTTB(DATAPOINT_CONFIG);

async function appendData(ctx) { // TODO FIXME
	try {
		const project = await ProjectModel.findOne({ _id: ctx.header.project });
		const dataset = await DatasetModel.findOne({
			$and: [{ _id: ctx.params.datasetId }, { _id: project.datasets }],
		})
			.populate('timeSeries')
			.exec();
		if (!project || !dataset) {
			ctx.body = { error: 'Forbidden' };
			ctx.status = 403;
			return ctx;
		}

		let globalStart = Infinity;
		let globalEnd;

		const timeSeries = ctx.request.body;
		const timeSeriesId = timeSeries.map((elm) => {
			const start = Math.min(...elm.data.map(d => d.timestamp));
			const end = Math.max(...elm.data.map(d => d.timestamp));
			globalStart = globalStart ? Math.min(start, globalStart) : start;
			globalEnd = globalEnd ? Math.max(end, globalEnd) : end;
			return {
				data: elm.data,
				start,
				end,
				_id: dataset.timeSeries.find(
					tS => tS.name === elm.name
				)._id,
			};
		});

		// Assume all timeseris have the same timestamps
		// const minTime = Math.min(...timeSeries[0].data.map((d) => d.timestamp));
		// const maxTime = Math.max(...timeSeries[0].data.map((d) => d.timestamp));

		await Promise.all(
			timeSeriesId.map(elm => TimeSeriesModel.findOneAndUpdate(
				{ _id: elm._id },
				{
					$push: { data: { $each: elm.data, $sort: { timestamp: 1 } } },
					$min: { start: elm.start },
					$max: { end: elm.end },
				}
			))
		);
		await DatasetModel.findOneAndUpdate(
			{ _id: ctx.params.datasetId },
			{
				$max: { end: globalEnd },
				$min: { start: globalStart },
			}
		);

		ctx.status = 200;
		ctx.body = { message: 'This is fine' };
		return ctx;
	} catch (e) {
		console.log(e);
		ctx.status = 500;
		ctx.body = { error: 'Internal server error' };
		return ctx;
	}
}

/**
 * get dataset timeseries by dataset id
 */
async function getDatasetTimeseriesById(ctx) {
	console.time('getDatasetTimeseriesById-firstpart')
	const project = await ProjectModel.findOne({ _id: ctx.header.project });
	const dataset = await DatasetModel.findOne({
		$and: [{ _id: ctx.params.datasetId }, { _id: project.datasets }],
	})
		.lean()
		.populate('timeSeries', 'levels start end')
		.exec();

	if (!project || !dataset) {
		ctx.body = { error: 'Forbidden' };
		ctx.status = 400;
		return ctx;
	}

	const start = ctx.request.query.start ? parseInt(ctx.request.query.start, 10) : dataset.start;
	const end = ctx.request.query.end ? parseInt(ctx.request.query.end, 10) : dataset.end;
	const maxResolution = ctx.request.query.max_resolution
		? parseInt(ctx.request.query.max_resolution, 10) : null;

	let allTimeseries = dataset.timeSeries;

	if (!maxResolution || !ENABLE_MIPMAPPING) {
		allTimeseries = allTimeseries.map(ts => ({ ...ts, levels: ts.levels[0].segments }));
	} else {
		// mipmapping
		const factor = (dataset.end - dataset.start) / (end - start); // scale resolution by window size
		const targetRes = factor * maxResolution;

		allTimeseries = await Promise.all(allTimeseries.map(async (ts) => {
			if (targetRes >= ts.levels[0].resolution) {
				return { ...ts, levels: ts.levels[0].segments };
			}

			let originalDataTemp = null;
			const originalUpdateTime = ts.levels[0].lastUpdated;

			let res = ts.levels[0].resolution;
			let index = 0;
			let currLevel = null;
			while (res > targetRes) {
				currLevel = ts.levels[index];

				if (!currLevel || currLevel.lastUpdated < originalUpdateTime) {
					// level either doesn't exist or is outdated, create anew
					console.assert(index > 0, 'BUG: trying to create original level');

					// read original data, since it's cached disable await warning below
					// eslint-disable-next-line no-await-in-loop
					originalDataTemp = originalDataTemp || await readSegments(ts.levels[0].segments);

					currLevel = {
						resolution: Math.floor(res / MIP_STEP),
						lastUpdated: Date.now(),
						// suppress, we may want to do this in parallel
						// but imo it would slow gridfs unnecessarily
						// eslint-disable-next-line no-await-in-loop
						segments: await createSegmentsFromTimeseriesData(lttb(originalDataTemp, res))
					};

					// eslint-disable-next-line no-await-in-loop
					await TimeSeriesModel.findOneAndUpdate(
						{ _id: ts._id },
						{ $set: { [`levels.${index}`]: currLevel } },
						{ new: true }
					);
				}

				res = currLevel.resolution;
				index++;
			}

			console.assert(index >= 0 && currLevel, `BUG: invalid mip map (${index}) returned for target resolution ${targetRes}, timeseries id: ${ts._id}`);

			return { ...ts, levels: currLevel.segments };
		}));
	}

	console.timeEnd('getDatasetTimeseriesById-firstpart')
	console.time('getDatasetTimeseriesById-readSegments')

	// range
	if (start <= dataset.start && dataset.end <= end) {
		// dataset fully within our desired window
		allTimeseries = await Promise.all(allTimeseries.map(async ts => ({ ...ts, levels: await readSegments(ts.levels) })));
	} else {
		// filter in datapoints within desired window
		allTimeseries = await Promise.all(allTimeseries.map(async ts => ({ ...ts, levels: await findRange(ts.levels, start, end) })));
	}

	console.timeEnd('getDatasetTimeseriesById-readSegments')
	console.time('getDatasetTimeseriesById-downsample')

	if (maxResolution && ENABLE_POST_WINDOW_DOWNSAMPLE) {
		allTimeseries = allTimeseries.map(({ levels, ...ts }) => ({ ...ts, levels: lttb(levels, maxResolution) }));
	}

	console.timeEnd('getDatasetTimeseriesById-downsample')

	ctx.body = allTimeseries.map(({ levels, ...ts }) => ({ ...ts, data: levels }));
	ctx.status = 200;
	return ctx.body;
}

module.exports = {
	appendData,
	getDatasetTimeseriesById,
};
