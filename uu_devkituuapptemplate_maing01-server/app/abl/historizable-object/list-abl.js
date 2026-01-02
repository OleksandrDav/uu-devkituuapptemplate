"use strict";
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;

const { CmdLoaderBuilder } = require("uu_businessbrickg02_lib").Common.Components.Loaders;

const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");
const HistorizableObjectConstants = require("../../constants/historizable-object-constants");

// const Errors = require("../../api/errors/historizable-object-error.js");

// const WARNINGS = {};

class ListAbl {
  constructor() {
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
  }

  async list(uri, dtoIn, session, uuAppErrorMap = {}) {
    const awid = uri.getAwid();
    const cmdLoader = new CmdLoaderBuilder(uri, dtoIn, session, uuAppErrorMap)
      .addDtoInValidation("historizableObjectListDtoInType")
      .addWorkspaceLoader();
    // 1.1, 1.2
    await cmdLoader.loadAll();

    // HDS 2.
    const dao = await this.dataStore.getAwidDao(HistorizableObjectConstants.UU_OBJECT_TYPE);
    let historizableObjectList = await dao.list({ awid });

    return { ...historizableObjectList, uuAppErrorMap };
  }
}

module.exports = new ListAbl();
