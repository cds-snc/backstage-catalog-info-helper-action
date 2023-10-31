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

const generateCatalogInfo = async (repository, teams = [], languages = {}) => {
  const entityOwners = await getEntityOwners(teams);
  const languagesList = Object.entries(languages).map(
    (language) => language[0],
  );
  const license = repository.license ? repository.license.spdx_id : undefined;
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
        entityOwners.length === 1
          ? entityOwners[0].slug
          : repository.owner.login,
    },
  };

  if (languagesList.length > 0) {
    if (catalogInfo.metadata.tags === undefined) {
      catalogInfo.metadata.tags = [];
    }
    languagesList.forEach((language) => {
      catalogInfo.metadata.tags.push(language);
    });
  }

  if (license !== undefined) {
    if (catalogInfo.metadata.labels === undefined) {
      catalogInfo.metadata.labels = {};
    }
    catalogInfo.metadata.labels.license = license;
  }

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
