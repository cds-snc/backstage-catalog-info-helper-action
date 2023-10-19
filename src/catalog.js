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
  // parses catalog-info.yaml into catalogInfo object
  // returns the parsed yaml
  let catalogInfo = {};
  try {
    catalogInfo = yaml.load(fs.readFileSync("catalog-info.yaml", "utf8"));
  } catch (error) {
    console.log(error);
  }
  return catalogInfo;
};

const getEntityOwner = async (repoOwner, teams) => {
  // check if there are teams
  if (teams.length === 0) {
    return repoOwner;
  }
  const owner = [];
  for (const team of teams) {
    if (team.permission === "admin") {
      owner.push(team);
    }
  }
  if (owner.length === 1) {
    return owner[0];
  } else {
    return repoOwner;
  }
};

const generateCatalogInfo = async (payload) => {
  const { repository, teams } = payload;

  const owner = await getEntityOwner(repository.owner, teams);
  // generates catalog-info.yaml
  // returns the generated yaml
  let catalogInfo = {
    apiVersion: " backstage.io/v1alpha1",
    kind: "Component",
    metadata: {
      name: repository.name,
      description: repository.description,
    },
    spec: {
      type: "website",
      lifecycle: "experimental",
      owner: owner.length !== 1 ? repository.owner : owner[0].name,
    },
  };
  try {
    catalogInfo = yaml.load(fs.readFileSync("catalog-info.yaml", "utf8"));
  } catch (error) {
    console.log(error);
  }
  return catalogInfo;
};

/**
 * Parse repository data and generate a catalog-info.yaml file.
 */

/**
 * Required yaml parameters for kind Component
 * apiVersion
 * kind
 * metadata
 *  name
 * spec
 *  type
 *  lifecycle
 *  owner
 */

// check if a file name catalog-info.yaml or yml exists in the root of the repository

// if it does not exist, create it

// if it does exist, parse it

// if it does exist, check if the apiVersion is the same as the current version

module.exports = { hasCatalogInfo, parseCatalogInfo, generateCatalogInfo };
