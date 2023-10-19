"use strict";

const github = require("@actions/github");
const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");
const { queryRepository, queryTeamsForRepository, queryCollaboratorsForRepository } = require("../src/query.js");
const { hasCatalogInfo, parseCatalogInfo } = require("../src/catalog.js");

const octokitAppAuth = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
  },
});

const getInstallationId = async () => {
  const { data: installations } = await octokitAppAuth.apps.listInstallations();
  const installation = installations.find(
    (installation) => installation.account.login === "cds-snc"
  );
  return installation.id;
};

const run = async () => {
  console.log("Getting installation ID...");
  const installationId = await getInstallationId();
  console.log(installationId);

  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
  });

  const installationAuthentication = await auth({
    type: "installation",
    installationId,
  });
  const octokit = github.getOctokit(installationAuthentication.token);

  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;

  console.log(`Owner: ${owner}\nRepo: ${repo}`);

  // get current repository data
  const repository = await queryRepository(octokit, owner, repo);
  console.log("Repository data");
  console.log("===============");
  console.log(repository);

  // get repository teams
  const teams = await queryTeamsForRepository(octokit, owner, repo);
  console.log("Teams");
  console.log("=====");
  console.log(teams);

  // get repository team permissions
  if (teams.length === 0) {
    console.log("No teams found");
  } else {
    console.log("Teams permissions");
    console.log("================\n");
    for (const team of teams) {
      console.log("----");
      console.log("name: " + team.name);
      console.log("permission: " + team.permission + "\n");
    }
  }

  const collaborators = await queryCollaboratorsForRepository(octokit, owner, repo);
  console.log("Collaborators");
  console.log("=============");
  for (const collaborator of collaborators) {
    console.log("----");
    // console.log("login: " + collaborator.login);
    // console.log("permission: " + collaborator.permission + "\n");
    console.log(collaborator.login)
    console.log(collaborator.role_name)
  }

  // check if catalog-info.yaml exists on root of repository
  console.log("Catalog info file exists");
  console.log("========================");
  const catalogInfo = await hasCatalogInfo();
  console.log(catalogInfo);

  // parse catalog-info.yaml
  console.log("Parsing catalog-info.yaml");
  console.log("=========================");
  const parsedCatalogInfo = await parseCatalogInfo();
  console.log(parsedCatalogInfo);

  // check if apiVersion is the same as the current version
  console.log("Checking apiVersion");
  console.log("===================");
  const apiVersion = parsedCatalogInfo.apiVersion;
  console.log(apiVersion);

};

run();
