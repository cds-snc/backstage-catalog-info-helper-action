"use strict";

const fs = require("fs");

const queryRepository = async (octokit, owner, repo) => {
  const response = await octokit.rest.repos.get({
    owner,
    repo,
  });
  if (response.status !== 200) {
    throw new Error(`Failed to query repository: ${response.status}`);
  }
  return response.data;
};

const queryTeamsForRepo = async (octokit, owner, repo) => {
  // use "slug" to reference teams - ref: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-teams
  const response = await octokit.rest.repos.listTeams({
    owner,
    repo,
  });
  if (response.status !== 200) {
    throw new Error(`Failed to query teams: ${response.status}`);
  }
  return response.data;
};

const queryTeamPermissionsForRepo = async (octokit, org, owner, repo, slug) => {
  // checks permissions for the team on the repository
  const response = await octokit.rest.teams.checkPermissionsForRepoInOrg({
    org,
    team_slug: slug,
    owner,
    repo,
  });
  if (response.status !== 200) {
    throw new Error(`Failed to query team permissions: ${response.status}`);
  }
  return response.data;
};

const hasCatalogInfo = async () => {
  // checks if catalog-info.yaml exists in the root of the repository
  const catalogInfo = fs.existsSync("catalog-info.yaml");
  if (catalogInfo) {
    console.log("catalog-info.yaml exists");
  } else {
    console.log("catalog-info.yaml does not exist");
  }
  return catalogInfo;
};

module.exports = {
  queryRepository,
  queryTeamsForRepo,
  queryTeamPermissionsForRepo,
  hasCatalogInfo,
};
