"use strict";
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;

const { CmdLoaderBuilder } = require("uu_businessbrickg02_lib").Common.Components.Loaders;

const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");
const HistorizableObjectConstants = require("../../constants/historizable-object-constants");

// const Errors = require("../../api/errors/historizableObject-error.js");

// const WARNINGS = {};

class GetAbl {
  constructor() {
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
  }

  async get(uri, dtoIn, session, uuAppErrorMap = {}) {
    const cmdLoader = new CmdLoaderBuilder(uri, dtoIn, session, uuAppErrorMap)
      .addDtoInValidation("historizableObjectGetDtoInType")
      .addWorkspaceLoader();
    // 1.1, 1.2
    await cmdLoader.loadAll();

    // HDS 2.
    const dao = await this.dataStore.getAwidDao(HistorizableObjectConstants.UU_OBJECT_TYPE);
    let historizableObject = await dao.get({ oid: dtoIn.oid });

    return { ...historizableObject, uuAppErrorMap };
  }
}

module.exports = new GetAbl();
