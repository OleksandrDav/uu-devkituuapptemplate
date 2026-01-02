"use strict";
const { Uri } = require("uu_appg01_server").Uri;
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;
const { LoggerFactory } = require("uu_appg01_server").Logging;

const { CmdLoaderBuilder } = require("uu_businessbrickg02_lib").Common.Components.Loaders;
const { UuTerrClient } = require("uu_territory_clientg01");

const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");
const HistorizableObjectConstants = require("../../constants/historizable-object-constants");

// const Errors = require("../../api/errors/historizable-object-error.js");

// const WARNINGS = {};

class LoadAbl {
  constructor() {
    this.logger = LoggerFactory.get(__filename);
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
  }

  async load(uri, dtoIn, session, authorizationResult, uuAppErrorMap = {}) {
    const cmdLoader = new CmdLoaderBuilder(uri, dtoIn, session, uuAppErrorMap)
      .addDtoInValidation("historizableObjectLoadDtoInType")
      .addWorkspaceLoader();
    // 1.1, 1.2
    const loaderResult = await cmdLoader.loadAll();
    let { workspaceObject: uuDevKitUuAppTemplate } = loaderResult;

    // HDS 2.
    const dao = await this.dataStore.getAwidDao(HistorizableObjectConstants.UU_OBJECT_TYPE);
    let historizableObject = await dao.get({ oid: dtoIn.oid });

    const uuTerritoryUri = Uri.parse(uuDevKitUuAppTemplate.uuTerritoryBaseUri).getBaseUri();
    const uuAtc = await UuTerrClient.Obc.loadData({ id: historizableObject.artifactId }, { baseUri: uuTerritoryUri, session });

    // HDS 4. - Returns properly filled dtoOut
    return {
      data: historizableObject,
      sysData: {
        profileData: {
          uuIdentityProfileList: authorizationResult.getUuIdentityProfileList(),
          profileList: authorizationResult.getAuthorizedProfileList(),
        },
      },
      territoryData: uuAtc,
      uuAppErrorMap,
    };
  }
}

module.exports = new LoadAbl();
