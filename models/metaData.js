const mongoose = require('mongoose');

const MetaData = new mongoose.Schema({
    editableMetaData: 
    { type: Map,
		of: String,
		default: {} },
    nonEditableMetaData: 
    { type: Map,
		of: String,
		default: {} },
});

module.exports = {
	model: mongoose.model('MetaData', MetaData),
	schema: MetaData
};
