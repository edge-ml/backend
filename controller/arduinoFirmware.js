const axios = require('axios');
const AdmZip = require('adm-zip');


const allowedDevices = ["nicla"];

async function getFirmware(ctx) {
    try {
        console.log(ctx.params)
        if (!allowedDevices.includes(ctx.params.deviceName)) {
            ctx.status = 400;
            ctx.body = { "message": "Device " + ctx.params.deviceName + " is not supported" };
            return ctx;
        }
        const response = await axios({
            url: `https://nightly.link/edge-ml/EdgeML-Arduino/workflows/build/main/${ctx.params.deviceName}.bin.zip`,
            method: 'GET',
            responseType: 'arraybuffer'
        });
        console.log(typeof (response.data));

        var zip = new AdmZip(response.data);
        var zipEntries = zip.getEntries();

        const data = zipEntries[0].getData();

        ctx.status = 200;
        ctx.body = data;
        return ctx;
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    getFirmware: getFirmware
}