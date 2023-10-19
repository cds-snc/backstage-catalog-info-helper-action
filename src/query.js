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

const queryTeamsForRepository = async (octokit, owner, repo) => {
  const response = await octokit.rest.repos.listTeams({
    owner,
    repo,
  });
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

module.exports = {
  queryRepository,
  queryTeamsForRepository,
  queryCollaboratorsForRepository,
};
