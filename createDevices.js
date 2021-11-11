const config = require("config");
const mongoose = require("mongoose");
const DeviceModel = require("./models/device").model;
const SensorModel = require("./models/sensor").model;
const util = require("util");

const preprocessDevice = (device) => {
  const sensorTypeMap = device.sensorTypeMap;
  const parseSchema = device.parseSchema;
  const deviceInfo = device.deviceInfo;

  const tmpSensorTypeMap = Object.keys(sensorTypeMap).map((key, index) => {
    return {
      ...sensorTypeMap[key],
      bleKey: key,
      typeName: sensorTypeMap[key]["type-name"],
    };
  });

  tmpSensorTypeMap.map((sensor) => {
    const foundSchema = parseSchema.types.find((elm) => elm.id === sensor.type);
    sensor.parseScheme = foundSchema["parse-scheme"].map((elm) => {
      return { ...elm, scaleFactor: elm["scale-factor"] };
    });
    sensor.typeName = foundSchema.type;
    delete sensor["type-name"];
    delete sensor["type"];
    return sensor;
  });
  return [deviceInfo, tmpSensorTypeMap];
};

const addDeviceToDataBase = async (device, sensorMap) => {
  return mongoose
    .connect(config.db, { useNewUrlParser: true })
    .then(() => {
      return DeviceModel.findOneAndUpdate({ name: device.name }, device, {
        upsert: true,
        new: true,
      });
    })
    .then((deviceDoc) => {
      return Promise.all(
        sensorMap.map((elm) =>
          SensorModel.findOneAndUpdate(
            { name: elm.name, device: deviceDoc._id },
            { ...elm, device: deviceDoc._id },
            {
              upsert: true,
            }
          )
        )
      );
    });
};

module.exports.addDevice = (device) => {
  const [deviceInfo, sensorMap] = preprocessDevice(device);
  return addDeviceToDataBase(deviceInfo, sensorMap);
};
