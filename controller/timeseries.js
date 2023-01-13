const DatasetModel = require('../models/dataset').model;
const ProjectModel = require('../models/project').model;
const TimeSeriesModel = require('../models/timeSeries').model;
const { resample, window } = require('../utils/timeseriesService');

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
	const project = await ProjectModel.findOne({ _id: ctx.header.project });
	const dataset = await DatasetModel.findOne({
		$and: [{ _id: ctx.params.datasetId }, { _id: project.datasets }],
	})
		.lean()
		.populate('timeSeries', 'levels')
		.exec();

	if (!project || !dataset) {
		ctx.body = { error: 'Forbidden' };
		ctx.status = 400;
		return ctx;
	}

	const allTimeseries = dataset.timeSeries;
	const allTimeSeriesIds = allTimeseries.map(sts => sts._id);
	const allTimeSeriesLevels = allTimeseries.map(sts => sts.levels);

	// let allTimeSeriesLeveledSegments;
	// if (ctx.request.query.max_resolution == null) {
	// 	allTimeSeriesLeveledSegments = allTimeSeriesLevels[0].segment;
	// }
	// const resolution = parseInt(ctx.request.query.max_resolution, 10);

	// allTimeSeriesLeveledSegments = allTimeSeriesLevels.map((levels) => {
	// 	for (const level of levels) {
	// 		if (level.resolution <= resolution) {
	// 			return timeserie.segment;
	// 		}

	// 	}
	// 	// no need to downsample as the data is smaller tha our target

	// 	return { _id: timeserie._id, data: lttb(timeserie.data, resolution) };
	// });
	const windowAllTimeseries = await window(
		dataset, allTimeSeriesLeveledSegments, ctx.request.query.start, ctx.request.query.end
	);

	ctx.body = windowAllTimeseries.map((ls, i) => ({ data: ls, _id: allTimeSeriesIds[i] }));
	ctx.status = 200;
	return ctx.body;
}

module.exports = {
	appendData,
	getDatasetTimeseriesById,
};
