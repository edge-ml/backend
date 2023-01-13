/* eslint-disable */
const Model = require("../models/dataset").model;
const UserModel = require("../models/user").model;
const createDataset = require('./dataset').createDataset;

function isNumber(val) {
	return /^-?[\d.]+(?:e-?\d+)?$/.test(val);
}

function generateRandomColor() {
	var letters = "0123456789ABCDEF";
	var color = "#";
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function checkHeaders(timeData) {
	const errors = [];
	for (var i = 0; i < timeData.length; i++) {
		const currentErrors = [];
		const header = timeData[i][0];
		if (header[0] !== "time") {
			currentErrors.push({ error: "Header must start with 'time'" });
			errors.push(currentErrors);
			continue;
		}
		for (var j = 1; j < header.length; j++) {
			if (
				!/label_.+_.+/gm.test(header[j]) &&
				!/sensor_[^\[\]]+(\[.*\])?/gm.test(header[j])
			) {
				currentErrors.push({
					error: `Wrong header format in colum ${j + 1}`,
				});
			}
		}
		if (currentErrors.length) {
			errors.push(currentErrors);
		}
	}
	return errors;
}

function extractTimeSeries(timeData, i) {
	const timeSeries = {
		name: timeData[0][i].replace("sensor_", "").split("[")[0],
		unit: /\[(.*)\]/.test(timeData[0][i])
			? timeData[0][i].match(/\[(.*)\]/).pop()
			: "",
		end: parseInt(timeData[timeData.length - 1][0], 10),
		start: parseInt(timeData[1][0], 10),
		data: [],
	};
	for (var j = 1; j < timeData.length; j++) {
		if (timeData[j][0] === "") {
			throw { error: `Timestamp missing in row ${j + 1}` };
		}
		if (!isNumber(timeData[j][0])) {
			throw { error: `Timestamp is not a number in row ${j + 1}` };
		}
		if (timeData[j][i] === "") {
			continue;
		}
		if (!isNumber(timeData[j][i])) {
			throw {
				error: `Sensor value is not a number in row ${j + 1}, column ${i + 1}`,
			};
		}
		timeSeries.data.push([
			parseInt(timeData[j][0], 10),
			parseFloat(timeData[j][i]),
		]);
	}
	return timeSeries;
}

function extractLabel(timeData, i) {
	const labelNames = [];

	const labelingName = timeData[0][i].split("_")[1];
	const labelName = timeData[0][i].split("_")[2];

	const labeling = {
		name: labelingName,
	};

	const labels = [
		{
			name: labelName,
			color: generateRandomColor(),
			isNewLabel: true,
		},
	];

	const datasetLabel = {
		name: labelingName,
		labels: [],
	};

	for (var j = 1; j < timeData.length; j++) {
		if (timeData[j][i] !== "") {
			var start = timeData[j][0];
			while (j < timeData.length && "" !== timeData[j][i]) {
				j++;
			}
			datasetLabel.labels.push({
				start: start,
				end: timeData[j - 1][0],
				name: labelName,
			});
			j--;
		}
	}
	return { datasetLabel: datasetLabel, labeling: labeling, labels: labels };
}

function processCSVColumn(timeData) {
	try {
		const timeSeries = [];
		const labelings = [];
		const numDatasets = timeData[0].length - 1;
		if (numDatasets === 0) {
			throw { error: "No data in csv file" };
		}
		for (var i = 1; i <= numDatasets; i++) {
			const csvLength = timeData[0].length;
			const csvLenghError = timeData.findIndex(
				(elm) => elm.length !== csvLength
			);
			if (csvLenghError > 0) {
				throw {
					error: `Each row needs the same number of elements, at line ${
						csvLenghError + 1
					}`,
				};
			}
			if (timeData.length < 2) {
				throw { error: "No data in csv file" };
			}
			if (timeData[0][i].startsWith("sensor_")) {
				timeSeries.push(extractTimeSeries(timeData, i));
			} else if (timeData[0][i].startsWith("label_")) {
				labelings.push(extractLabel(timeData, i));
			} else {
				throw { error: "Wrong format" };
			}
		}

		const uniquelabelingNames = new Set(
			labelings.map((elm) => elm.labeling.name)
		);
		const resultingLabelings = [];
		uniquelabelingNames.forEach((labelingName) => {
			const labelingToAppend = {
				datasetLabel: { name: labelingName, labels: [] },
				labeling: { name: labelingName },
				labels: [],
			};
			labelingToAppend.labels.push(
				...labelings
					.filter((elm) => elm.labeling.name === labelingName)
					.map((data) => data.labels)
					.flat(1)
			);
			labelingToAppend.datasetLabel.labels = labelings
				.filter((elm) => elm.labeling.name === labelingName)
				.map((data) => data.datasetLabel.labels)
				.flat(1);
			resultingLabelings.push(labelingToAppend);
		});
		const result = {
			start: timeSeries[0].start,
			end: parseInt(timeData[timeData.length - 1][0], 10),
			timeSeries: timeSeries,
		};
		return { dataset: result, labeling: resultingLabelings };
	} catch (err) {
		console.log("process CSV column error");
		console.log(err);
		return [{ error: err }];
	}
}

async function generateDataset(timeData) {
	// console.log(timeData);
	const headerErrors = checkHeaders(timeData);
	if (headerErrors.some((elm) => elm.length > 0)) {
		ctx.body = headerErrors;
		ctx.status = 400;
		return;
	}
	const datasets = [];
	const labelings = [];
	const errors = [];
	for (var i = 0; i < timeData.length; i++) {
		const dataset = processCSVColumn(timeData[i]);
		// console.log('processed dataset')
		// console.log(dataset)
		if (!Array.isArray(dataset)) {
			datasets.push(dataset.dataset);
			labelings.push(dataset.labeling);
			errors.push([]);
			// console.log('error found in if')
		} else {
			// console.log('error found in else')
			errors.push(dataset);
		}
	}
	// console.log("here");
	// console.log(errors);
	const returnBody = {
		errors: undefined,
		datasets: undefined,
		labelings: undefined,
	};
	if (errors.some((elm) => elm.length > 0)) {
		returnBody.errors = errors;
		return returnBody;
	}
	returnBody.datasets = datasets;
	returnBody.labelings = labelings;
	return returnBody;
}

async function processCSV(ctx) {
	console.time('process CSV')
	console.log('print files')
	const { file } = ctx.request;
	console.log(file);
	const timeData = [];
	
	const res = file.buffer.toString("utf-8");
	const allTextLines = res.split(/\r\n|\n/);
	if (allTextLines[allTextLines.length - 1] === "") {
		allTextLines.pop();
	}
	const lines = [];
	for (let i = 0; i < allTextLines.length; i++) {
		const data = allTextLines[i].replace(/\s/g, "").split(",");
		lines.push(data);
	}
	timeData.push(lines);

	console.timeEnd('process CSV')
	console.time('generateDataset')
	const { errors, datasets, labelings } = await generateDataset(timeData);
	console.timeEnd('generateDataset')
	console.time('upload')
	if (errors) {
		ctx.status = 400;
		ctx.body = errors;
		return;
	}

	console.time('copy')
	const dataset = {
		name: 'hardcoded name',
		labelings: [],
		start: datasets[0].start,
		end: datasets[0].end,
		timeSeries: datasets[0].timeSeries,
	}
	dataset.projectId = ctx.header.project;
	// if userId empty, set it to requesting user
	if (!dataset.userId) {
		const { authId } = ctx.state;
		const user = await UserModel.findOne({ authId });
		dataset.userId = user._id;
	}
	try {
		createDataset(dataset);
	} catch (e) {
		console.log(e);
		ctx.status = 400;
		ctx.body = e;
	}
	ctx.status = 200;
	ctx.body = { datasets: [{
		start: datasets[0].start,
		end: datasets[0].end,
		timeSeries: datasets[0].timeSeries.map(e => ({
			name: e.name,
			unit: e.unit,
			start: e.start,
			end: e.end,
			offset: e.offset,
		}))
	}], labelings: labelings };
	return ctx;
}

module.exports = {
	processCSV,
};
