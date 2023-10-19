"use strict";

const core = require("@actions/core");
const github = require("@actions/github");

const { createAppAuth } = require("@octokit/auth-app");

const {
  queryRepository,
  //   queryTeamsForRepo,
  //   queryTeamPermissionsForRepo,
  hasCatalogInfo,
} = require("./query.js");

const action = async () => {
  const githubAppId = core.getInput("github-app-id", {
    trimWhitespace: true,
  });
  const githubAppPrivateKey = core.getInput("github-app-private-key", {
    trimWhitespace: true,
  });
  const githubAppInstallationId = core.getInput("github-app-installation-id", {
    trimWhitespace: true,
  });

  const auth = createAppAuth({
    appId: githubAppId,
    privateKey: githubAppPrivateKey,
  });

  const installationAuthentication = await auth({
    type: "installation",
    installationId: githubAppInstallationId,
  });

  const octokit = github.getOctokit(installationAuthentication.token);

  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;

  // get current repository data
  const repository = await queryRepository(octokit, owner, repo);

  // get repository teams

  //   const teams = queryTeamsForRepo(octokit, owner, repo);
  //   // eslint-disable-next-line prefer-const
  //   for (let team of teams) {
  //     console.log(queryTeamPermissionsForRepo(octokit, owner, repo, team.slug));
  //   }
  // check if config-info.yaml exists on root of repository
  const catalogInfo = await hasCatalogInfo();

  console.log(repository);
  //   console.log(teams);
  console.log(catalogInfo);
};

module.exports = { action };
