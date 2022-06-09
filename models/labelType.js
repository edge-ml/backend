const mongoose = require('mongoose');

const LabelType = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'please enter a labelType name']
	},
	color: {
		type: String,
		required: [true, 'a label needs a color']
	}
});

module.exports = {
	model: mongoose.model('LabelType', LabelType),
	schema: LabelType
};
