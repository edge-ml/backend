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
		unique: true
	},
	sensors: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		default: []
	}
});

module.exports = {
	model: mongoose.model('Device', Device),
	schema: Device,
};
