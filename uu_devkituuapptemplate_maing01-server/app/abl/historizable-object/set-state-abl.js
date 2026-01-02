"use strict";
const { Uri } = require("uu_appg01_server").Uri;
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;
const { AuthenticationService } = require("uu_appg01_server").Authentication;

const { UuTerrClient } = require("uu_territory_clientg01");

const { CmdLoaderBuilder } = require("uu_businessbrickg02_lib").Common.Components.Loaders;
const { BusinessBrickObject } = require("uu_businessbrickg02_common");

const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");
const HistorizableObjectConstants = require("../../constants/historizable-object-constants");

// const Errors = require("../../api/errors/historizable-object-error.js");

// const WARNINGS = {};

class SetStateAbl {
  constructor() {
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
    this.businessBrickObject = new BusinessBrickObject({ uuAppTypeCode: HistorizableObjectConstants.UU_OBJECT_TYPE });
  }

  async setState(uri, dtoIn, session, uuAppErrorMap = {}) {
    const cmdLoader = new CmdLoaderBuilder(uri, dtoIn, session, uuAppErrorMap)
      .addDtoInValidation("historizableObjectSetStateDtoInType")
      .addWorkspaceLoader();
    const loaderResult = await cmdLoader.loadAll();
    let { workspaceObject: uuDevKitUuAppTemplate } = loaderResult;

    const uuTerritoryUri = Uri.parse(uuDevKitUuAppTemplate.uuTerritoryBaseUri).getBaseUri();
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const appTokenOpts = { baseUri: uuTerritoryUri, session: sysIdentitySession };

    // HDS 2.
    const dao = await this.dataStore.getAwidDao(HistorizableObjectConstants.UU_OBJECT_TYPE);
    let historizableObject = await dao.get({ oid: dtoIn.oid });

    historizableObject.state = dtoIn.state;
    historizableObject = await this.businessBrickObject.update({ uuObject: historizableObject });

    await UuTerrClient.Obc.setState({ id: historizableObject.artifactId, state: historizableObject.state }, appTokenOpts);

    return { ...historizableObject, uuAppErrorMap };
  }
}

module.exports = new SetStateAbl();
