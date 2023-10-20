"use strict"

const core = require("@actions/core")

core.info("Hello world!")
core.getInput("github-app-id")

/**
 * Logs an error and sets the action as failed.
 * @param {String} err Error message
 */
const handleError = (err) => {
  console.error(err);
  core.setFailed(`Unhandled error: ${err}`);
};

const main = async () => {
  core.info("Hello world!")
  const appId = core.getInput("github-app-id")
  core.info(`App ID: ${appId}`)
}

main().catch(handleError)
