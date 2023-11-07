"use strict";

const fs = require("fs");
const github = require("@actions/github");
// const { Octokit } = require("@octokit/rest");
// const { createAppAuth } = require("@octokit/auth-app");
const { setupOctokit,queryRepository, queryRepositoriesForOrg ,queryTeamsForRepository, queryLanguagesForRepository } = require("../src/query.js");
const {
  hasCatalogInfo,
  parseCatalogInfo,
  getEntityOwners,
  generateCatalogInfo,
  saveCatalogInfo,
} = require("../src/catalog.js");

// const octokitAppAuth = new Octokit({
//   authStrategy: createAppAuth,
//   auth: {
//     appId: process.env.GH_APP_ID,
//     privateKey: process.env.GH_APP_PRIVATE_KEY,
//   },
// });

// const getInstallationId = async () => {
//   const { data: installations } = await octokitAppAuth.apps.listInstallations();
//   const installation = installations.find(
//     (installation) => installation.account.login === "cds-snc"
//   );
//   return installation.id;
// };

const run = async () => {
  // console.log("Getting installation ID...");
  // const installationId = await getInstallationId();
  // console.log(installationId);

  // const auth = createAppAuth({
  //   appId: process.env.GH_APP_ID,
  //   privateKey: process.env.GH_APP_PRIVATE_KEY,
  // });

  // const installationAuthentication = await auth({
  //   type: "installation",
  //   installationId,
  // });

  const githubAppId = process.env.GH_APP_ID;
  const githubAppPrivateKey = process.env.GH_APP_PRIVATE_KEY;
  const organization = github.context.repo.owner;

  const octokit = await setupOctokit(githubAppId, githubAppPrivateKey, organization);
  // const octokit = github.getOctokit(installationAuthentication.token);

  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;

  console.log(`Owner: ${owner}\nRepo: ${repo}`);
  console.log(" Repository data sent to Azure Log Analytics");


  console.log("✅ Getting repository data...");
  // get current repository data
  const repository = await queryRepository(octokit, owner, repo);
  console.log("Repository data");
  console.log("===============");
  console.log(repository);

  console.log("✅ Getting repositories for organization...");
  console.log("=========================================");
  const repositories = await queryRepositoriesForOrg(octokit, owner);
  console.log(repositories);
  console.log(`Found ${repositories.length} repositories for ${owner}`);


  console.log("✅ Getting project license...");
  console.log("===========================");
  console.log(Object.entries(repository.license))

  // get repository teams
  console.log(`👥 Getting teams for ${owner}/${repo}...`);
  const teams = await queryTeamsForRepository(octokit, owner, repo);
  console.log("Teams");
  console.log("=====");
  console.log(teams);


  // get repository languages
  console.log(`👥 Getting languages for ${owner}/${repo}...`);
  const languages = await queryLanguagesForRepository(octokit, owner, repo);
  console.log("Languages");
  console.log("=====");
  console.log(languages);


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

  // get entity owners
  const entityOwners = await getEntityOwners(teams);
  console.log("Entity owners");
  console.log("=============");
  console.log(entityOwners);

  // check if catalog-info.yaml exists on root of repository
  console.log("Catalog info file exists?");
  console.log("========================");
  const hasCatalogInfoFile = await hasCatalogInfo();
  console.log(hasCatalogInfoFile);

  if (hasCatalogInfoFile) {
    // if file exists, delete it
    console.log("Deleting catalog-info.yaml");
    fs.rmSync("catalog-info.yaml");
  }
  // generate catalog-info.yaml
  console.log("✅ Generating catalog-info.yaml...");
  console.log("============================");
  const catalogInfoContent = await generateCatalogInfo(repository, teams, languages);
  console.log(catalogInfoContent);

  // save catalog-info.yaml
  console.log("Saving catalog-info.yaml");
  console.log("========================");
  saveCatalogInfo(catalogInfoContent)
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

  console.log("Deleting catalog-info.yaml");
  fs.rmSync("catalog-info.yaml");
};

run();
