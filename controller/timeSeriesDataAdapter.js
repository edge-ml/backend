const axios = require('axios')
const TimeSeries = require("../models/timeSeries").model;

URL = "http://localhost:8000/"

async function addTimeSeriesBatch(timeSeries) {

    timeSeries.forEach((_, idx, _2) => {
        timeSeries[idx].data = timeSeries[idx].data.map(elm => [elm.timestamp, elm.datapoint])
    });

    try {
        const res = await axios({
            headers: {
                'Content-Type': 'application/json'
            },
            method: "post",
            'maxContentLength': Infinity,
            'maxBodyLength': Infinity,
            url: URL,
            data: timeSeries
        })
        console.log(res)
    } catch (e) {
        console.log(e);
    }
}

async function deleteTimeSeries(id) {
    try {
        const res = await axios({
            headers: { 'Content-Type': 'application/json' },
            method: "delete",
            url: URL + id,
        })
    } catch (e) {
        console.log(e);
    }
}


async function getTimeSeriesData(_id) {
    const res = await axios.get(URL + "load/" + _id)
    return res.data;
}

async function storeTimeSeriesData(_id, time, data) {
    try {
        const res = await axios({
            method: "post",
            url: URL + "save/" + _id,
            data: {
                time: time,
                data: data
            }
        })
        console.log(res.data)
    }
    catch (e) {
        console.log(e)
    }
}

async function insertTimeSeriesBatch(timeSeries, dataset) {
    // Add to database
    const ts = await Promise.all(timeSeries.map(elm => TimeSeries.create({ ...elm, dataset: dataset._id })))

    // Store data of the time series as blob
    await Promise.all(ts.map(elm => storeTimeSeriesData(elm._id)))
}


/*
* Delete timeSeries
*/
async function deleteTimeSeriesByID(_id) {
    try {
        const res = await axios({
            method: "delete",
            url: URL + "/" + _id,
        })
    } catch (e) {
        console.log(e)
    }
}
async function deleteTimeSeriesBatch(timeSeriesIds) {
    await Promise.all(timeSeriesIds.map(elm => deleteTimeSeriesByID(elm)))
}

module.exports = {
    getTimeSeriesData: getTimeSeriesData,
    insertTimeSeriesBatch: insertTimeSeriesBatch,
    deleteTimeSeriesByID: deleteTimeSeriesByID,
    addTimeSeriesBatch: addTimeSeriesBatch,
    deleteTimeSeries: deleteTimeSeries
}