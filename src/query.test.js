"use strict";

const { when } = require("jest-when");
const github = require("@actions/github");
const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");
const {
  setupOctokit,
  queryRepository,
  queryRepositoriesForOrg,
  queryTeamsForRepository,
  queryCollaboratorsForRepository,
  queryLanguagesForRepository,
} = require("./query");
jest.mock("@actions/github");
jest.mock("@octokit/auth-app");
jest.mock("@octokit/rest");

describe("setupOctokit", () => {
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

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("returns a new Octokit instance with the correct installation token", async () => {
    const githubAppId = "github-app-id";
    const githubAppPrivateKey = "github-app-private-key";
    const organization = "github-organization";

    when(Octokit).mockImplementation(() => {
      return {
        apps: {
          listInstallations: jest
            .fn()
            .mockResolvedValue({ data: installationsData }),
        },
      };
    });

    when(createAppAuth).mockImplementation(() => {
      return async ({ type, installationId }) => {
        return {
          type: type,
          token: "mock_token",
          installationId: installationId,
        };
      };
    });

    when(github.getOctokit).calledWith("mock_token").mockReturnValue("octokitInstance");

    const result = await setupOctokit(
      githubAppId,
      githubAppPrivateKey,
      organization,
    );

    expect(result).toBe("octokitInstance");

    expect(Octokit).toHaveBeenCalledWith({
      authStrategy: createAppAuth,
      auth: {
        appId: githubAppId,
        privateKey: githubAppPrivateKey,
      },
    });
    expect(createAppAuth).toHaveBeenCalledWith({
      appId: githubAppId,
      privateKey: githubAppPrivateKey,
    });
  });
});

describe("queryRepository", () => {
  test("returns the repository data if the response status is 200", async () => {
    const octokit = {
      rest: {
        repos: {
          get: jest.fn(),
        },
      },
    };

    const response = {
      status: 200,
      data: {
        owner: { login: "octocat" },
        name: "hello-world",
      },
    };

    when(octokit.rest.repos.get)
      .calledWith({ owner: "octocat", repo: "hello-world" })
      .mockReturnValue(response);

    const result = await queryRepository(octokit, "octocat", "hello-world");

    expect(result).toEqual(response.data);
  });

  test("throws an error if the request failed", async () => {
    const octokit = {
      rest: {
        repos: {
          get: jest.fn(),
        },
      },
    };

    const response = {
      status: 400,
    };

    const owner = "owner";
    const repo = "repo";

    when(octokit.rest.repos.get)
      .calledWith({ owner, repo })
      .mockReturnValue(response);

    await expect(queryRepository(octokit, owner, repo)).rejects.toThrow(
      `Failed to query repository: ${response.status}`,
    );
  });
});

describe("queryRepositoriesForOrg", () => {
  const repositories = [
    { name: "repo1", archived: false, visibility: "public" },
    { name: "repo2", archived: true, visibility: "private" },
    { name: "repo3", archived: false, visibility: "private" },
    { name: "repo4", archived: true, visibility: "public" },
  ];

  test("returns an array of repositories if successful", async () => {
    const octokit = {
      rest: {
        repos: {
          listForOrg: {
            endpoint: {
              merge: jest.fn(),
            },
          },
        },
      },
      paginate: jest.fn().mockResolvedValue(repositories),
    };

    const org = "octocat";

    const result = await queryRepositoriesForOrg(octokit, org);

    expect(result).toEqual(repositories);
  });

  test("throws an error if the request failed", async () => {
    const octokit = {
      rest: {
        repos: {
          listForOrg: {
            endpoint: {
              merge: jest.fn(),
            },
          },
        },
      },
      paginate: jest.fn().mockRejectedValue(new Error("Request failed")),
    };

    const org = "octocat";

    await expect(
      queryRepositoriesForOrg(octokit, org),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"Request failed"`);
  });
});

describe("queryTeamsForRepository", () => {
  test("returns the teams data if the response status is 200", async () => {
    const octokit = {
      rest: {
        repos: {
          listTeams: jest.fn(),
        },
      },
    };

    const response = {
      status: 200,
      data: [
        { name: "Team 1", id: 1, slug: "team-1", permission: "admin" },
        { name: "Team 2", id: 2, slug: "team-2", permission: "push" },
        { name: "Team 3", id: 3, slug: "team-3", permission: "pull" },
      ],
    };

    const owner = "owner";
    const repo = "repo";

    when(octokit.rest.repos.listTeams)
      .calledWith({ owner, repo })
      .mockReturnValue(response);

    const result = await queryTeamsForRepository(octokit, owner, repo);

    expect(result).toEqual(response.data);
  });

  test("returns an empty array if the response status is 404", async () => {
    const octokit = {
      rest: {
        repos: {
          listTeams: jest.fn(),
        },
      },
    };

    const response = {
      status: 404,
    };

    const owner = "owner";
    const repo = "repo";

    when(octokit.rest.repos.listTeams)
      .calledWith({ owner, repo })
      .mockReturnValue(response);

    const result = await queryTeamsForRepository(octokit, owner, repo);

    expect(result).toEqual([]);
  });

  test("throws an error if the request failed", async () => {
    const octokit = {
      rest: {
        repos: {
          listTeams: jest.fn(),
        },
      },
    };
    const response = {
      status: 400,
    };

    const owner = "owner";
    const repo = "repo";

    when(octokit.rest.repos.listTeams)
      .calledWith({ owner, repo })
      .mockReturnValue(response);

    await expect(queryTeamsForRepository(octokit, owner, repo)).rejects.toThrow(
      `Failed to query teams: ${response.status}`,
    );
  });
});

describe("queryCollaboratorsForRepository", () => {
  test("returns the collaborators data if the response status is 200", async () => {
    const octokit = {
      rest: {
        repos: {
          listCollaborators: jest.fn(),
        },
      },
    };

    const response = {
      status: 200,
      data: [
        {
          login: "username",
          id: 1234,
          url: "https://someurl.com",
          type: "User",
          site_admin: false,
          permissions: {
            admin: false,
            maintain: true,
            push: true,
            triage: true,
            pull: true,
          },
        },
        {
          login: "username2",
          id: 1235,
          url: "https://someurl.com",
          type: "User",
          site_admin: false,
          permissions: {
            admin: false,
            maintain: true,
            push: true,
            triage: true,
            pull: true,
          },
        },
      ],
    };

    const owner = "owner";
    const repo = "repo";

    when(octokit.rest.repos.listCollaborators)
      .calledWith({ owner, repo })
      .mockReturnValue(response);

    const result = await queryCollaboratorsForRepository(octokit, owner, repo);

    expect(result).toEqual(response.data);
  });
  test("throws an error if the request failed", async () => {
    const octokit = {
      rest: {
        repos: {
          listCollaborators: jest.fn(),
        },
      },
    };
    const response = {
      status: 400,
    };

    const owner = "owner";
    const repo = "repo";

    when(octokit.rest.repos.listCollaborators)
      .calledWith({ owner, repo })
      .mockReturnValue(response);

    await expect(
      queryCollaboratorsForRepository(octokit, owner, repo),
    ).rejects.toThrow(`Failed to query collaborators: ${response.status}`);
  });
});

describe("queryLanguagesForRepository", () => {
  test("returns the languages data if the response status is 200", async () => {
    const octokit = {
      rest: {
        repos: {
          listLanguages: jest.fn(),
        },
      },
    };

    const response = {
      status: 200,
      data: {
        JavaScript: 100,
        HTML: 50,
      },
    };
    const owner = "owner";
    const repo = "repo";

    when(octokit.rest.repos.listLanguages)
      .calledWith({ owner, repo })
      .mockReturnValue(response);

    const result = await queryLanguagesForRepository(octokit, owner, repo);

    expect(result).toEqual(response.data);
  });
  test("throws an error if the request failed", async () => {
    const octokit = {
      rest: {
        repos: {
          listLanguages: jest.fn(),
        },
      },
    };
    const response = {
      status: 400,
    };
    const owner = "owner";
    const repo = "repo";

    when(octokit.rest.repos.listLanguages)
      .calledWith({ owner, repo })
      .mockReturnValue(response);
    await expect(
      queryLanguagesForRepository(octokit, owner, repo),
    ).rejects.toThrow(`Failed to query languages: ${response.status}`);
  });
});
