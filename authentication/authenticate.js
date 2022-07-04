const config = require('config');
const jwt = require('jsonwebtoken');
const Model = require('../models/user').model;

function verifyAccessToken(token) {
	const payload = jwt.verify(token, config.secret);
	return payload.id;
}

module.exports = async (ctx, next) => {
	const url = ctx.request.url.split('/');
	console.log(url)
	try {
		if (
			(url[2].toLowerCase() === 'checkout' && url[3].toLowerCase() === 'webhook') || 
			(url[2].toLowerCase() === 'deviceapi'
			&& url[3].toLowerCase() !== 'deletekey'
			&& url[3].toLowerCase() !== 'switchactive'
			&& url[3].toLowerCase() !== 'getkey'
			&& url[3].toLowerCase() !== 'setkey')
		) {
			return next();
		}
	} catch (err) {
		console.log(err);
	}
	let userId;
	try {
		const token = ctx.headers.authorization.split(' ')[1];
		userId = verifyAccessToken(token);
	} catch (err) {
		console.log(err);
		ctx.status = 401;
		ctx.body = {
			error: 'Unauthorized',
		};
		return ctx;
	}
	ctx.state.authId = userId;
	// check if we see this user for the first time: do we have this authId already in db?
	const user = await Model.find({ authId: userId });
	if (!user.length) {
		// if not, create a new user object
		const document = new Model({ authId: userId });
		await document.save();
	}
	return next();
};
