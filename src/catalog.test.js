"use strict";

const fs = require("fs");
const yaml = require("js-yaml");
const {
  hasCatalogInfo,
  parseCatalogInfo,
  getEntityOwners,
  generateCatalogInfo,
  saveCatalogInfo,
} = require("./catalog");

describe("hasCatalogInfo", () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test("should return true if catalog-info.yaml exists", async () => {
    fs.existsSync = jest.fn().mockReturnValueOnce(true);
    const expectedMessage = "catalog-info.yaml exists";
    const result = await hasCatalogInfo();

    expect(result).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith("catalog-info.yaml");
    expect(consoleSpy).toHaveBeenCalledWith(expectedMessage);
  });

  test("should return false if catalog-info.yaml does not exist", async () => {
    fs.existsSync = jest.fn().mockReturnValueOnce(false);
    const expectedMessage = "catalog-info.yaml does not exist";
    const result = await hasCatalogInfo();

    expect(result).toBe(false);
    expect(fs.existsSync).toHaveBeenCalledWith("catalog-info.yaml");
    expect(consoleSpy).toHaveBeenCalledWith(expectedMessage);
  });
});

describe("parseCatalogInfo", () => {
  let consoleSpy;
  let readFileSyncSpy;

  beforeEach(() => {
    readFileSyncSpy = jest.spyOn(fs, "readFileSync");
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    readFileSyncSpy.mockRestore();
    consoleSpy.mockRestore();
  });
  test("should return the parsed yaml if the file exists", async () => {
    const catalogInfo = { name: "component name" };
    const yamlString = yaml.dump(catalogInfo);
    readFileSyncSpy.mockReturnValueOnce(yamlString);
    const result = await parseCatalogInfo();
    expect(result).toEqual(catalogInfo);
  });

  test("should return an empty object if the file does not exist", async () => {
    readFileSyncSpy.mockImplementation(() => {
      throw new Error("File does not exist");
    });
    const result = await parseCatalogInfo();
    expect(result).toEqual({});
  });

  test("should log the error if the file does not exist", async () => {
    const expectedMessage = "File does not exist";
    readFileSyncSpy.mockImplementation(() => {
      throw new Error(expectedMessage);
    });
    await parseCatalogInfo();
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe("getEntityOwners", () => {
  test("should return an empty array if there are no teams", async () => {
    const teams = [];
    const result = await getEntityOwners(teams);
    expect(result).toEqual([]);
  });

  test("should return an empty array if there are no teams with admin permissions", async () => {
    const teams = [
      { name: "Team 1", id: 1, slug: "team-1", permission: "maintain" },
      { name: "Team 2", id: 2, slug: "team-2", permission: "triage" },
      { name: "Team 3", id: 3, slug: "team-3", permission: "maintain" },
    ];
    const result = await getEntityOwners(teams);
    expect(result).toEqual([]);
  });

  test("should return an array with the teams with admin permissions", async () => {
    const teams = [
      { name: "Team 1", id: 1, slug: "team-1", permission: "admin" },
      { name: "Team 2", id: 2, slug: "team-2", permission: "triage" },
      { name: "Team 3", id: 3, slug: "team-3", permission: "admin" },
    ];

    const result = await getEntityOwners(teams);
    expect(result).toEqual([
      { name: "Team 1", id: 1, slug: "team-1", permission: "admin" },
      { name: "Team 3", id: 3, slug: "team-3", permission: "admin" },
    ]);
  });
});

describe("generateCatalogInfo", () => {
  test("should return the catalogInfo object with owner set to repository owner login if multiple teams owner", async () => {
    const repository = {
      name: "component name",
      description: "component description",
      owner: { login: "component owner" },
    };
    const teams = [
      { name: "Team 1", id: 1, slug: "team-1", permission: "admin" },
      { name: "Team 2", id: 2, slug: "team-2", permission: "triage" },
      { name: "Team 3", id: 3, slug: "team-3", permission: "admin" },
    ];

    const result = await generateCatalogInfo(repository, teams);
    expect(result).toEqual({
      apiVersion: "backstage.io/v1alpha1",
      kind: "Component",
      metadata: {
        name: "component name",
        description: "component description",
      },
      spec: {
        type: "website",
        lifecycle: "experimental",
        owner: "component owner",
      },
    });
  });

  test("should return the catalogInfo object with owner set to repository owner login if no teams", async () => {
    const repository = {
      name: "component name",
      description: "component description",
      owner: { login: "component owner" },
    };
    const teams = [];

    const result = await generateCatalogInfo(repository, teams);
    expect(result).toEqual({
      apiVersion: "backstage.io/v1alpha1",
      kind: "Component",
      metadata: {
        name: "component name",
        description: "component description",
      },
      spec: {
        type: "website",
        lifecycle: "experimental",
        owner: "component owner",
      },
    });
  });

  test("should return the catalogInfo object with owner set to single team owner slug", async () => {
    const repository = {
      name: "component name",
      description: "component description",
      owner: { login: "component owner" },
    };
    const teams = [
      { name: "Team 1", id: 1, slug: "team-1", permission: "admin" },
      { name: "Team 2", id: 2, slug: "team-2", permission: "triage" },
      { name: "Team 3", id: 3, slug: "team-3", permission: "maintain" },
    ];

    const result = await generateCatalogInfo(repository, teams);
    expect(result).toEqual({
      apiVersion: "backstage.io/v1alpha1",
      kind: "Component",
      metadata: {
        name: "component name",
        description: "component description",
      },
      spec: {
        type: "website",
        lifecycle: "experimental",
        owner: "team-1",
      },
    });
  });
});

describe("saveCatalogInfo", () => {
  let dumpSpy = jest.spyOn(yaml, "dump");
  let writeFileSyncSpy = jest
    .spyOn(fs, "writeFileSync")
    .mockImplementation(() => {});

  beforeEach(() => {
    dumpSpy = jest.spyOn(yaml, "dump");
    writeFileSyncSpy = jest.spyOn(fs, "writeFileSync");
  });

  afterEach(() => {
    dumpSpy.mockRestore();
    writeFileSyncSpy.mockRestore();
  });

  test("should save the catalogInfo object to catalog-info.yaml", async () => {
    const catalogInfo = {
      apiVersion: "backstage.io/v1alpha1",
      kind: "Component",
      metadata: {
        name: "component name",
        description: "component description",
      },
      spec: {
        type: "website",
        lifecycle: "experimental",
        owner: "component owner",
      },
    };
    await saveCatalogInfo(catalogInfo);
    expect(dumpSpy).toHaveBeenCalledWith(catalogInfo);
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      "catalog-info.yaml",
      yaml.dump(catalogInfo),
      "utf8",
    );
  });
  test("should log the error if the file does not exist", async () => {
    const expectedMessage = "File does not exist";
    const catalogInfo = {
      apiVersion: "backstage.io/v1alpha1",
      kind: "Component",
      metadata: {
        name: "component name",
        description: "component description",
      },
      spec: {
        type: "website",
        lifecycle: "experimental",
        owner: "component owner",
      },
    };
    jest.spyOn(yaml, "dump").mockImplementation(() => {
      throw new Error(expectedMessage);
    });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    await saveCatalogInfo(catalogInfo);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
