"use strict";

// const core = require("@actions/core");
const github = require("@actions/github");

const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");
const { queryRepository, queryTeamsForRepository } = require("./query.js");
const {
  hasCatalogInfo,
  generateCatalogInfo,
  saveCatalogInfo,
} = require("./catalog.js");

const action = async () => {
  const githubAppId = process.env.GITHUB_APP_ID;
  const githubAppPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const organization = process.env.GITHUB_ORGANIZATION;

  const octokitAppAuth = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GH_APP_ID,
      privateKey: process.env.GH_APP_PRIVATE_KEY,
    },
  });

  const getInstallationId = async () => {
    const { data: installations } =
      await octokitAppAuth.apps.listInstallations();
    const installation = installations.find(
      (installation) => installation.account.login === organization
    );
    return installation.id;
  };

  const githubAppInstallationId = await getInstallationId();

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
  console.log(`👥 Getting teams for ${owner}/${repo}...`);
  const teams = await queryTeamsForRepository(octokit, owner, repo);

  // check if catalog-info.yaml exists
  const hasCatalogInfoFile = await hasCatalogInfo();

  // if catalog-info.yaml does not exist, generate it
  if (!hasCatalogInfoFile) {
    console.log("Generating catalog-info.yaml...");
    const catalogInfoContent = await generateCatalogInfo(repository, teams);
    await saveCatalogInfo(catalogInfoContent);
  } else {
    console.log("catalog-info.yaml already exists.");
  }
};

module.exports = { action };
