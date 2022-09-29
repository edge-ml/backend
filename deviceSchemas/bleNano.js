exports.device = {
  sensorTypeMap: {
    0: {
      name: "ACC",
      type: 0,
      "type-name": "xyz",
    },

    1: {
      name: "GYRO",
      type: 0,
      "type-name": "xyz",
    },

    2: {
      name: "MAG",
      type: 0,
      "type-name": "xyz",
    },

    3: {
      name: "TEMPERATURE",
      type: 1,
      "type-name": "single_float",
    },

    4: {
      name: "HUMIDITY",
      type: 1,
      "type-name": "single_float",
    },

    5: {
      name: "PRESSURE",
      type: 1,
      "type-name": "single_float",
    },

    6: {
      name: "COLOR",
      type: 2,
      "type-name": "color",
    },

    7: {
      name: "BRIGHTNESS",
      type: 3,
      "type-name": "single_int",
    },

    8: {
      name: "PROXIMITY",
      type: 3,
      "type-name": "single_int",
    },
    /*
    9: {
      name: "GESTURE",
      type: 3,
      "type-name": "single_int",
    },*/
  },
  parseSchema: {
    types: [
      {
        id: 0,
        type: "xyz",
        "parse-scheme": [
          { name: "x", type: "float", "scale-factor": 1 },
          { name: "y", type: "float", "scale-factor": 1 },
          { name: "z", type: "float", "scale-factor": 1 },
        ],
      },

      {
        id: 1,
        type: "single_float",
        "parse-scheme": [{ name: "val", type: "float", "scale-factor": 1 }],
      },

      {
        id: 2,
        type: "color",
        "parse-scheme": [
          { name: "r", type: "int16", "scale-factor": 1 },
          { name: "g", type: "int16", "scale-factor": 1 },
          { name: "b", type: "int16", "scale-factor": 1 },
        ],
      },

      {
        id: 3,
        type: "single_int",
        "parse-scheme": [{ name: "val", type: "int16", "scale-factor": 1 }],
      },
    ],
  },
  deviceInfo: [{ name: "NANO", generation: "1.0.0", maxSampleRate: 30 }],
};
