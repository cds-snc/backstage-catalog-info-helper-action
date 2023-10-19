"use strict";

const core = require("@actions/core");
const github = require("@actions/github");

const { createAppAuth } = require("@octokit/auth-app");
const { queryRepository, queryTeamsForRepository } = require("./query.js");
const {
  hasCatalogInfo,
  generateCatalogInfo,
  saveCatalogInfo,
} = require("./catalog.js");

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
  core.info(`👥 Getting teams for ${owner}/${repo}...`);
  const teams = await queryTeamsForRepository(octokit, owner, repo);

  // check if catalog-info.yaml exists
  const hasCatalogInfoFile = await hasCatalogInfo();

  // if catalog-info.yaml does not exist, generate it
  if (!hasCatalogInfoFile) {
    core.info("Generating catalog-info.yaml...");
    const catalogInfoContent = await generateCatalogInfo({ repository, teams });
    saveCatalogInfo(catalogInfoContent);
  } else {
    core.info("catalog-info.yaml already exists.");
  }
};

module.exports = { action };
