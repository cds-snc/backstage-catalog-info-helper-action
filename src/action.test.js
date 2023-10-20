"use strict";

const github = require("@actions/github");
require("@octokit/auth-app");
const { when } = require("jest-when");

const { action } = require("./action.js");

const { queryRepository, queryTeamsForRepository } = require("./query.js");
const {
  hasCatalogInfo,
  generateCatalogInfo,
  saveCatalogInfo,
} = require("./catalog.js");

jest.mock("@actions/core");
jest.mock("@actions/github", () => ({
  context: {
    repo: {
      owner: "owner",
      repo: "repo",
    },
  },
  getOctokit: jest.fn(),
}));
jest.mock("@octokit/auth-app", () => ({
  createAppAuth: () => () => ({
    type: "app",
    token: "token",
  }),
}));
jest.mock("./query.js");
jest.mock("./catalog.js");

describe("action", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      GITHUB_APP_ID: "github-app-id",
      GITHUB_APP_PRIVATE_KEY: "github-app-private-key",
      GITHUB_ORGANIZATION: "github-organization",
    };
  });

  test("default flow", async () => {
    const repoData = {
      id: "123456",
      name: "repo",
      full_name: "owner/repo",
      description: "repo description",
      owner: {
        login: "owner",
      },
    };

    const teamsData = [
      {
        name: "team1 name",
        id: "123",
        slug: "team1-name",
        description: "team1 description",
        permission: "maintain",
      },
      {
        name: "team2 name",
        id: "456",
        slug: "team2-name",
        description: "team2 description",
        permission: "admin",
      },
    ];

    when(process.env)
      .calledWith("GITHUB_APP_ID")
      .mockReturnValue("github-app-id");

    when(process.env)
      .calledWith("GITHUB_APP_PRIVATE_KEY")
      .mockReturnValue("github-app-private-key");

    when(process.env)
      .calledWith("GITHUB_ORGANIZATION")
      .mockReturnValue("github-organization");

    when(github.getOctokit).calledWith("token").mockReturnValue("octokit");

    when(queryRepository)
      .calledWith("octokit", "owner", "repo")
      .mockReturnValue(repoData);

    when(queryTeamsForRepository)
      .calledWith("octokit", "owner", "repo")
      .mockReturnValue(teamsData);

    when(hasCatalogInfo).calledWith().mockReturnValue(false);

    const catalogInfoData = {
      apiVersion: "backstage.io/v1alpha1",
      kind: "Component",
      metadata: {
        name: "repo",
        description: "repo description",
      },
      spec: {
        type: "website",
        lifecycle: "experimental",
        owner: "team2-name",
      },
    };

    when(generateCatalogInfo)
      .calledWith("repository", "teams")
      .mockReturnValue(catalogInfoData);

    await action();

    expect(queryRepository).toHaveBeenCalledWith("octokit", "owner", "repo");
    expect(queryTeamsForRepository).toHaveBeenCalledWith(
      "octokit",
      "owner",
      "repo"
    );
    expect(hasCatalogInfo).toReturnWith(false);

    expect(generateCatalogInfo).toHaveBeenCalledWith(repoData, teamsData);

    expect(saveCatalogInfo).toHaveBeenCalled();
  });

  test("catalog-info.yaml already exists", async () => {
    when(process.env)
      .calledWith("GITHUB_APP_ID")
      .mockReturnValue("github-app-id");

    when(process.env)
      .calledWith("GITHUB_APP_PRIVATE_KEY")
      .mockReturnValue("github-app-private-key");

    when(process.env)
      .calledWith("GITHUB_ORGANIZATION")
      .mockReturnValue("github-organization");

    when(github.getOctokit).calledWith("token").mockReturnValue("octokit");

    when(queryRepository)
      .calledWith("octokit", "owner", "repo")
      .mockReturnValue("repository");

    when(queryTeamsForRepository)
      .calledWith("octokit", "owner", "repo")
      .mockReturnValue("teams");

    when(hasCatalogInfo).calledWith().mockReturnValue(true);

    await action();

    expect(queryRepository).toHaveBeenCalledWith("octokit", "owner", "repo");
    expect(queryTeamsForRepository).toHaveBeenCalledWith(
      "octokit",
      "owner",
      "repo"
    );
    expect(hasCatalogInfo).toReturnWith(true);

    expect(generateCatalogInfo).not.toHaveBeenCalled();

    expect(saveCatalogInfo).not.toHaveBeenCalled();
  });
});
