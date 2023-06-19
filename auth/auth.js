const config = require('config');
const jwt = require('jsonwebtoken');
const ProjectModel = require("../models/project").model;


const validate_user = async (ctx, next) => {
    try {
        const token = ctx.headers.authorization.split(' ')[1]
        const user_id = jwt.verify(token, config.secret).id
        ctx.state.authId = user_id;
        return next()
    }
    catch (err) {
        ctx.status = 401;
        ctx.body = {error: "Unauthorized"}
        return ctx;
    }
}

const validate_user_project = async (ctx, next) => {
    try {
        const projectId = ctx.header.project;
        if (!projectId) {
            ctx.status = 400;
            ctx.body = {error: "Missing project header"}
        }
        const token = ctx.headers.authorization.split(' ')[1]
        const user_id = jwt.verify(token, config.secret).id
        
        const project = ProjectModel.find({$and: [{_id: projectId}, {$or: {users: user_id, admin: user_id}}]})
        if (!project) {
            throw new Error()
        }

        ctx.state.authId = user_id;
        return next()
    }
    catch (err) {
        console.log(err)
        ctx.status = 401;
        ctx.body = {error: "Unauthorized"}
        return ctx;
    }
}

module.exports = {
    validate_user: validate_user,
    validate_user_project: validate_user_project
}

