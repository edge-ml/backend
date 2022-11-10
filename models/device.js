const mongoose = require('mongoose');

const Device = new mongoose.Schema({
	sensors: { type: [mongoose.Schema.Types.ObjectId], ref: 'Sensor' },
	generation: {
		type: Number,
		required: [true, 'generation cannot be empty'],
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	name: {
		type: String,
		required: true,
	},
	maxSampleRate: {
		type: Number,
		required: true
	}
});

Device.index({"name": 1, "generation": 1}, {unique: true});

module.exports = {
	model: mongoose.model('Device', Device),
	schema: Device,
};
