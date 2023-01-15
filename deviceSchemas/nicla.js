exports.device = {
  sensorTypeMap: {
    4: {
      name: "ACC",
      type: 5,
      "type-name": "xyz",
      sampleRate: 10,
    },
    13: {
      name: "GYRO",
      type: 5,
      "type-name": "xyz",
      sampleRate: 10,
    },

    22: {
      name: "MAGNET",
      type: 5,
      "type-name": "xyz",
      sampleRate: 10,
    },

    43: {
      name: "ORIENTATION",
      type: 6,
      "type-name": "orientation",
    },

    128: {
      name: "TEMPERATURE",
      type: 0,
      "type-name": "temperature",
      sampleRate: 2,
    },

    129: {
      name: "BAROMETER",
      type: 7,
      "type-name": "barometer",
      sampleRate: 2,
    },
    130: {
      name: "HUMIDITY",
      type: 1,
      "type-name": "humidity",
      sampleRate: 2,
    },

    131: {
      name: "GAS",
      type: 8,
      "type-name": "gas",
      sampleRate: 2,
    },
  },
  parseSchema: {
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
        "parse-scheme": [
          { name: "val", type: "uint24", "scale-factor": 0.008 },
        ],
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
        "parse-scheme": [
          { name: "val", type: "uint24", "scale-factor": 0.008 },
        ],
      },

      {
        id: 8,
        type: "gas",
        "parse-scheme": [{ name: "val", type: "uint32", "scale-factor": 1 }],
      },
    ],
  },
  deviceInfo: { name: "NICLA", generation: "1", maxSampleRate: 30 },
};
