const mongoose = require('mongoose');

const DatasetLabel = new mongoose.Schema({
	type: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Label'
	},
	start: {
		type: Number,
		required: [true, 'event value cannot be empty']
	},
	end: {
		type: Number,
		required: [true, 'event value cannot be empty']
	}
});

module.exports = {
	model: mongoose.model('DatasetLabel', DatasetLabel),
	schema: DatasetLabel
};
