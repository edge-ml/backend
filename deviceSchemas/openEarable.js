exports.device = {
    sensorTypeMap: {
    0: {
      name: 'ACC',
      type: 0,
      'type-name': 'xyz',
      sampleRate: 10
    },

    1: {
      name: 'GYRO',
      type: 0,
      'type-name': 'xyz',
      sampleRate: 10
    },

    2: {
      name: 'PRESSURE',
      type: 1,
      'type-name': 'single_float',
      sampleRate: 10
    },

    3: {
      name: 'TEMP',
      type: 1,
      'type-name': 'single_float',
      sampleRate: 10
    },
  },
  parseSchema: {
    types: [
      {
        id: 0,
        type: 'xyz',
        'parse-scheme': [
          { name: 'x', type: 'float', 'scale-factor': 1 },
          { name: 'y', type: 'float', 'scale-factor': 1 },
          { name: 'z', type: 'float', 'scale-factor': 1 },
        ],
      },
      {
        id: 1,
        type: 'single_float',
        'parse-scheme': [{ name: 'val', type: 'float', 'scale-factor': 1 }],
      },
    ],
  },
  deviceInfo: {name: "Earable", generation: "1", maxSampleRate: 30}
};
