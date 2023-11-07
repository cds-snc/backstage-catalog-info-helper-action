"use strict";

const core = require("@actions/core");
const github = require("@actions/github");
require("@octokit/auth-app");
const { Octokit } = require("@octokit/rest");
const { when } = require("jest-when");

const { action } = require("./action.js");

const {
  setupOctokit,
  queryRepository,
  queryRepositoriesForOrg,
  queryTeamsForRepository,
} = require("./query.js");
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
jest.mock("@octokit/rest", () => {
  return {
    Octokit: jest.fn().mockImplementation({
      apps: {
        listInstallations: jest.fn(),
      },
    }),
  };
});
jest.mock("./query.js");
jest.mock("./catalog.js");

describe("action", () => {
  // eslint-disable-next-line no-unused-vars
  let consoleSpy;

  const reposData = [
    {
      id: "123456",
      name: "repo",
      full_name: "owner/repo",
      description: "repo description",
      owner: {
        login: "owner",
      },
    },
    {
      id: "234567",
      name: "other-repo",
      full_name: "owner/other-repo",
      description: "other-repo description",
      owner: {
        login: "owner",
      },
    },
  ];

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

  beforeEach(() => {
    jest.resetAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  test("default flow", async () => {
    when(core.getInput)
      .calledWith("github_app_id")
      .mockReturnValue("github-app-id");
    when(core.getInput)
      .calledWith("github_app_private_key")
      .mockReturnValue("github-app-private-key");
    when(core.getInput)
      .calledWith("github_organization")
      .mockReturnValue("github-organization");

    when(setupOctokit)
      .calledWith(
        "github-app-id",
        "github-app-private-key",
        "github-organization",
      )
      .mockReturnValue("octokit");
    when(queryRepository)
      .calledWith("octokit", "owner", "repo")
      .mockReturnValue(reposData[0]);

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

    expect(core.getInput).toHaveBeenCalledWith("github_app_id");
    expect(core.getInput).toHaveBeenCalledWith("github_app_private_key");
    expect(core.getInput).toHaveBeenCalledWith("github_organization");
    expect(setupOctokit).toHaveBeenCalledWith(
      "github-app-id",
      "github-app-private-key",
      "github-organization",
    );

    expect(queryRepositoriesForOrg).toHaveBeenCalledWith(
      "octokit",
      "github-organization",
    );

    expect(queryTeamsForRepository).toHaveBeenCalledWith(
      "octokit",
      "owner",
      "repo",
    );

    expect(hasCatalogInfo).toReturnWith(false);

    expect(generateCatalogInfo).toHaveBeenCalledWith(reposData[0], teamsData);

    expect(saveCatalogInfo).toHaveBeenCalled();
  });

  test("catalog-info.yaml already exists", async () => {
    const installationsData = [
      {
        id: 1,
        account: {
          login: "github-organization",
        },
      },
      {
        id: 2,
        account: {
          login: "other-org",
        },
      },
    ];

    when(Octokit).mockImplementation(() => {
      return {
        apps: {
          listInstallations: jest
            .fn()
            .mockImplementation(() => ({ data: installationsData })),
        },
      };
    });
    const octokitMock = new Octokit();

    when(octokitMock.apps.listInstallations)
      .calledWith()
      .mockReturnValue(installationsData);
    when(github.getOctokit).calledWith("token").mockReturnValue("octokit");

    when(queryRepository)
      .calledWith("octokit", "owner", "repo")
      .mockReturnValue("repository");

    when(queryTeamsForRepository)
      .calledWith("octokit", "owner", "repo")
      .mockReturnValue("teams");

    when(hasCatalogInfo).calledWith().mockReturnValue(true);

    when(core.getInput)
      .calledWith("github_app_id")
      .mockReturnValue("github-app-id");
    when(core.getInput)
      .calledWith("github_app_private_key")
      .mockReturnValue("github-app-private-key");
    when(core.getInput)
      .calledWith("github_organization")
      .mockReturnValue("github-organization");

    await action();

    // expect(queryRepository).toHaveBeenCalledWith("octokit", "owner", "repo");
    // expect(queryTeamsForRepository).toHaveBeenCalledWith(
    //   "octokit",
    //   "owner",
    //   "repo",
    // );
    expect(hasCatalogInfo).toReturnWith(true);

    expect(generateCatalogInfo).not.toHaveBeenCalled();

    expect(saveCatalogInfo).not.toHaveBeenCalled();
  });
});
