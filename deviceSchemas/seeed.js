exports.device = {
    sensorTypeMap: {
        0: {
            "name": "ACC",
            "type": 0,
            "type-name": "xyz"
        },

        1: {
            "name": "GYRO",
            "type": 0,
            "type-name": "xyz"
        },

        2: {
            "name": "TEMP",
            "type": 1,
            "type-name": "xyz"
        }
    },
    parseSchema: {
        "types":
            [

                {
                    "id": 0,
                    "type": "xyz",
                    "parse-scheme":
                        [
                            {"name": "x", "type": "float", "scale-factor": 1},
                            {"name": "y", "type": "float", "scale-factor": 1},
                            {"name": "z", "type": "float", "scale-factor": 1}
                        ]
                },
                {
                    "id": 1,
                    "type": "single_float",
                    "parse-scheme":
                        [
                            {"name": "val", "type": "float", "scale-factor": 1}
                        ]
                }
            ]
    },
    deviceInfo: { name: "Seeed XIAO", generation: "1.0.0", maxSampleRate: 30 },
};
