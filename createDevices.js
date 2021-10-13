const config = require("config");
const mongoose = require("mongoose");
const DeviceModel = require("./models/device").model;
const SensorModel = require("./models/sensor").model;
const SensorParseSchemaModel = require("./models/sensorParseScheme").model;
const util = require("util");

const sensorTypeMap = {
  1: {
    name: "ACC_PASS",
    type: 5,
    "type-name": "xyz",
  },

  3: {
    name: "ACC_RAW",
    type: 5,
    "type-name": "xyz",
  },

  4: {
    name: "ACC",
    type: 5,
    "type-name": "xyz",
  },

  5: {
    name: "ACC_BIAS",
    type: 5,
    "type-name": "xyz",
  },

  6: {
    name: "ACC_WU",
    type: 5,
    "type-name": "xyz",
  },

  7: {
    name: "ACC_RAW_WU",
    type: 5,
    "type-name": "xyz",
  },

  10: {
    name: "GYRO_PASS",
    type: 5,
    "type-name": "xyz",
  },

  12: {
    name: "GYRO_RAW",
    type: 5,
    "type-name": "xyz",
  },

  13: {
    name: "GYRO",
    type: 5,
    "type-name": "xyz",
  },

  22: {
    name: "MAGNET",
    type: 5,
    "type-name": "xyz",
  },

  24: {
    name: "MAGNET_WU",
    type: 5,
    "type-name": "xyz",
  },

  28: {
    name: "GRAVITY",
    type: 5,
    "type-name": "xyz",
  },

  32: {
    name: "LINEAR_ACC_WU",
    type: 5,
    "type-name": "xyz",
  },

  43: {
    name: "ORI",
    type: 6,
    "type-name": "orientation",
  },

  128: {
    name: "TEMPERATURE",
    type: 0,
    "type-name": "temperature",
  },

  132: {
    name: "TEMPERATURE_WU",
    type: 0,
    "type-name": "temperature",
  },

  130: {
    name: "HUMIDITY",
    type: 1,
    "type-name": "humidity",
  },

  134: {
    name: "HUMIDITY_WU",
    type: 1,
    "type-name": "humidity",
  },

  129: {
    name: "BAROMETER",
    type: 7,
    "type-name": "barometer",
  },

  133: {
    name: "BAROMETER_WU",
    type: 7,
    "type-name": "barometer",
  },

  131: {
    name: "GAS",
    type: 8,
    "type-name": "gas",
  },

  135: {
    name: "GAS_WU",
    type: 8,
    "type-name": "gas",
  },
};

const parseSchema = {
  types: [
    {
      id: 0,
      type: "temperature",
      "parse-scheme": [{ name: "val", type: "int16", "scale-factor": 0.01 }],
    },

    {
      id: 1,
      type: "humidity",
      "parse-scheme": [{ name: "val", type: "uint8", "scale-factor": 1 }],
    },

    {
      id: 2,
      type: "pressure",
      "parse-scheme": [{ name: "val", type: "uint24", "scale-factor": 0.008 }],
    },

    {
      id: 3,
      type: "altitude",
      "parse-scheme": [{ name: "val", type: "float", "scale-factor": 1 }],
    },

    {
      id: 4,
      type: "quaternion",
      "parse-scheme": [
        { name: "x", type: "int16", "scale-factor": 1 },
        { name: "y", type: "int16", "scale-factor": 1 },
        { name: "z", type: "int16", "scale-factor": 1 },
        { name: "w", type: "int16", "scale-factor": 1 },
        { name: "accuracy", type: "uint16", "scale-factor": 1 },
      ],
    },

    {
      id: 5,
      type: "xyz",
      "parse-scheme": [
        { name: "x", type: "int16", "scale-factor": 1 },
        { name: "y", type: "int16", "scale-factor": 1 },
        { name: "z", type: "int16", "scale-factor": 1 },
      ],
    },

    {
      id: 6,
      type: "orientation",
      "parse-scheme": [
        { name: "heading", type: "int16", "scale-factor": 0.01098 },
        { name: "pitch", type: "int16", "scale-factor": 0.01098 },
        { name: "roll", type: "int16", "scale-factor": 0.01098 },
      ],
    },

    {
      id: 7,
      type: "barometer",
      "parse-scheme": [{ name: "val", type: "uint24", "scale-factor": 0.008 }],
    },

    {
      id: 8,
      type: "gas",
      "parse-scheme": [{ name: "val", type: "uint32", "scale-factor": 1 }],
    },
  ],
};

const tmpSensorTypeMap = Object.keys(sensorTypeMap).map((key, index) => {
  return {
    ...sensorTypeMap[key],
    bleKey: key,
    typeName: sensorTypeMap[key]["type-name"],
  };
});

tmpSensorTypeMap.map((sensor) => {
  const foundSchema = parseSchema.types.find((elm) => elm.id === sensor.type);
  sensor.parseScheme = foundSchema["parse-scheme"];
  sensor.typeName = foundSchema.type;
  delete sensor["type-name"]
  delete sensor["type"]
  return sensor;
});

const niclaDevice = { name: "Nicla", generation: "1" };

module.exports.populateDatabase_Nicla = async () => {
  return mongoose
    .connect(config.db, { useNewUrlParser: true })
    .then(() => {
      return DeviceModel.findOneAndUpdate(niclaDevice, niclaDevice, {
        upsert: true,
        new: true,
      });
    })
    .then((deviceDoc) => {
      return Promise.all(
        tmpSensorTypeMap.map((elm) =>
          SensorModel.findOneAndUpdate({name: elm.name, device: deviceDoc._id}, {...elm, device: deviceDoc._id}, {
            upsert: true,
          })
        )
      );
    });
};