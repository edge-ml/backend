const mongoose = require("mongoose");

const LabelDefinition = new mongoose.Schema({
	labels: {
		type: [mongoose.Schema.Types.ObjectId],
		ref: "LabelType",
	},
	name: {
		type: String,
		required: true
	},
});

module.exports = {
	model: mongoose.model("LabelDefinition", LabelDefinition),
	schema: LabelDefinition,
};
