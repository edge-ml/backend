const mongoose = require("mongoose");
const Project = require("../models/project").model;
const axios = require("axios");
const config = require("config");

function filterProjectNonAdmin(ctx, project) {
  const { authId } = ctx.state;
  return authId === String(project.admin._id)
    ? project
    : {
      name: project.name,
      _id: project._id,
      admin: project.admin,
      enableDeviceApi: project.enableDeviceApi,
    };
}

async function addUserNamesAndCleanProject(retrievedProjects, ctx) {
  var userData = (
    await Promise.all(
      retrievedProjects.map((project) => {
        return axios.post(
          config.auth + "/userName",
          [project.admin, ...project.users],
          { headers: { Authorization: ctx.headers.authorization } }
        );
      })
    )
  ).map((user) => user.data);

  // Delete users not present in auth servie
  const result = [];
  await Promise.all(
    retrievedProjects.map((project, index) => {
      const admin = userData[index][0];
      const users = userData[index].slice(1).filter((elm) => !elm.error);

      if (admin.error) {
        return Project.deleteOne({ _id: project._id });
      }

      project.users = users.map((elm) => elm._id);
      result.push({ ...project.toObject(), admin: admin, users: users });
      return project.save();
    })
  );
  return result;
}

/**
 * get all projects where the user has access to
 */
async function getProjects(ctx, next) {
  try {
    const { authId } = ctx.state;
    const body = await Project.find({
      $or: [{ admin: authId }, { users: authId }],
    });

    const result = await addUserNamesAndCleanProject(body, ctx);

    ctx.body = result.map((elm) => filterProjectNonAdmin(ctx, elm));
    ctx.status = 200;
    return ctx;
  } catch (err) {
    ctx.status = 500;
    return ctx;
  }
}
/*
 * Creates a new project
 */
async function createProject(ctx) {
  try {
    const project = ctx.request.body;
    // The admin is the one creating the project
    const { authId } = ctx.state;
    project.admin = authId;
    const document = new Project(project);
    await document.save();

    ctx.body = document;
    ctx.status = 201;
    return ctx;
  } catch (e) {
    if (e.code === 11000 && e.keyPattern.admin && e.keyPattern.name) {
      ctx.body = { error: "A project with this name already exists" };
      ctx.status = 400;
      return ctx;
    }
    ctx.body = { error: e.message };
    ctx.status = 400;
    return ctx;
  }
}

/*
 * Deletes a project when a user has the access rights
 */
async function deleteProjectById(ctx) {
  const { authId } = ctx.state;
  const project = await Project.findOne({
    $and: [
      { _id: ctx.params.id },
      { $or: [{ admin: authId }, { users: authId }] },
    ],
  });
  if (project === undefined) {
    ctx.body = { message: "Cannot delete this project" };
    ctx.status = 400;
    return ctx;
  }
  project.remove();
  ctx.body = { message: `deleted project with id: ${ctx.params.id}` };
  ctx.status = 200;
  return ctx;
}

async function updateProjectById(ctx) {
  try {
    const { authId } = ctx.state;
    const project = ctx.request.body;
    project.users = ctx.request.body.users.map((elm) =>
      typeof elm === "object" ? elm._id : elm
    );
    await Project.findOneAndUpdate(
      { $and: [{ _id: ctx.params.id }, { admin: authId }] },
      { $set: project },
      { runValidators: true }
    );
    ctx.body = { message: `updated project with id: ${ctx.params.id}` };
    ctx.status = 200;
  } catch (e) {
    if (e.code === 11000 && e.keyPattern.admin && e.keyPattern.name) {
      ctx.body = { error: "A project with this name already exists" };
      ctx.status = 400;
    } else {
      ctx.status = 400;
      ctx.body = { error: e.errors.name.properties.message };
    }
  }
  return ctx;
}

async function getProjectById(ctx) {
  const { authId } = ctx.state;
  const project = await Project.findOne({
    $and: [
      { _id: ctx.params.id },
      { $or: [{ admin: authId }, { users: authId }] },
    ],
  });

  const result = await addUserNamesAndCleanProject([project], ctx);

  ctx.body = filterProjectNonAdmin(ctx, result[0]);
  ctx.status = 200;
}

module.exports = {
  getProjects,
  deleteProjectById,
  createProject,
  updateProjectById,
  getProjectById,
};
