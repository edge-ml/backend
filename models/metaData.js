const mongoose = require('mongoose');

const MetaData = new mongoose.Schema({
    value: { type: String, required: [true, "please enter a value for the metaData"] },
    deleteableByUser: { type: Boolean, required: [true, "please specify if the user may delete the metaData"] },
});

module.exports = {
	model: mongoose.model('MetaData', MetaData),
	schema: MetaData
};
