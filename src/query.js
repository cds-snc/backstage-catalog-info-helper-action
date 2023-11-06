"use strict";

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

const queryRepositoriesForOrg = async (octokit, org) => {
  const options = octokit.rest.repos.listForOrg.endpoint.merge({
    org,
    per_page: 100,
  });
  const response = await octokit.paginate(options);

  if (!response) {
    throw new Error(`Failed to query repositories for org: ${org}`);
  }

  return response;
};

const queryTeamsForRepository = async (octokit, owner, repo) => {
  const response = await octokit.rest.repos.listTeams({
    owner,
    repo,
  });
  if (response.status === 404) {
    return [];
  }
  if (response.status !== 200) {
    throw new Error(`Failed to query teams: ${response.status}`);
  }
  return response.data;
};

const queryCollaboratorsForRepository = async (octokit, owner, repo) => {
  const response = await octokit.rest.repos.listCollaborators({
    owner,
    repo,
  });
  if (response.status !== 200) {
    throw new Error(`Failed to query collaborators: ${response.status}`);
  }
  return response.data;
};

const queryLanguagesForRepository = async (octokit, owner, repo) => {
  const response = await octokit.rest.repos.listLanguages({ owner, repo });
  if (response.status !== 200) {
    throw new Error(`Failed to query languages: ${response.status}`);
  }
  return response.data;
};

module.exports = {
  queryRepository,
  queryRepositoriesForOrg,
  queryTeamsForRepository,
  queryCollaboratorsForRepository,
  queryLanguagesForRepository,
};
