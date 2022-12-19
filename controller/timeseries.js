const DatasetModel = require('../models/dataset').model;
const ProjectModel = require('../models/project').model;
const TimeSeriesModel = require('../models/timeSeries').model;

async function appendData(ctx) {
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
		.populate('timeSeries', 'data')
		.exec();

	if (!project || !dataset) {
		ctx.body = { error: 'Forbidden' };
		ctx.status = 400;
		return ctx;
	}

	// INFO: there is currently a timeseries migration to gridfs? ongoing,
	// therefore we simply filter in js here, since we'll most probably redo
	// it later.
	const timeseries = dataset.timeSeries;

	console.log('timeseries!');

	ctx.body = timeseries;
	ctx.status = 200;
	return ctx.body;
}

module.exports = {
	appendData,
	getDatasetTimeseriesById,
};
