"use strict";

const fs = require("fs");
const yaml = require("js-yaml");

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

const parseCatalogInfo = async () => {
  // parses catalog-info.yaml into catalogInfo object, returns the parsed yaml
  let catalogInfo = {};
  try {
    catalogInfo = yaml.load(fs.readFileSync("catalog-info.yaml", "utf8"));
  } catch (error) {
    console.log(error);
  }
  return catalogInfo;
};

const getEntityOwners = async (teams) => {
  // check if there are teams with admin permissions
  const owner = [];
  if (teams.length === 0) {
    return owner;
  }
  for (const team of teams) {
    if (team.permission === "admin") {
      owner.push(team);
    }
  }
  return owner;
};

const generateCatalogInfo = async (repository, teams) => {
  const componentOwner = await getEntityOwners(teams);
  const catalogInfo = {
    apiVersion: "backstage.io/v1alpha1",
    kind: "Component",
    metadata: {
      name: repository.name,
      description: repository.description,
    },
    spec: {
      type: "website",
      lifecycle: "experimental",
      owner:
        componentOwner.length === 1
          ? componentOwner[0].slug
          : repository.owner.login,
    },
  };

  return catalogInfo;
};

const saveCatalogInfo = async (catalogInfo) => {
  try {
    catalogInfo = yaml.dump(catalogInfo);
    fs.writeFileSync("catalog-info.yaml", catalogInfo, "utf8");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  hasCatalogInfo,
  parseCatalogInfo,
  getEntityOwners,
  generateCatalogInfo,
  saveCatalogInfo,
};
