"use strict";
const { UuAppWorkspace } = require("uu_appg01_server").Workspace;
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;

const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");

class LoadAbl {
  constructor() {
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
  }

  async load(uri, session, uuAppErrorMap) {
    const awidData = await UuAppWorkspace.load(uri, session, uuAppErrorMap);

    const awidDao = await this.dataStore.getAwidDao(
      DevKitUuAppTemplateMainConstants.Schemas.DEVKITUUAPPTEMPLATE_INSTANCE,
    );
    const uuDevKitUuAppTemplate = await awidDao.getByAwid(uri.getAwid());

    // TODO Implement according to application needs...

    const dtoOut = {
      data: uuDevKitUuAppTemplate,
      ...awidData,
      territoryData: {
        data: {
          ...awidData?.territoryData?.data?.data,
          uuAppWorkspace: uri.getBaseUri(),
          uuTerritoryBaseUri: awidData.territoryData?.data?.data?.context?.territory.uuTerritoryBaseUri,
        },
      },
    };

    return dtoOut;
  }

  async loadBasicData(uri, session, uuAppErrorMap = {}) {
    // HDS 1
    const dtoOut = await UuAppWorkspace.loadBasicData(uri, session, uuAppErrorMap);

    // TODO Implement according to application needs...
    // const awid = uri.getAwid();
    // const workspace = await UuAppWorkspace.get(awid);
    // if (workspace.sysState !== UuAppWorkspace.SYS_STATES.CREATED &&
    //    workspace.sysState !== UuAppWorkspace.SYS_STATES.ASSIGNED
    // ) {
    //   const appData = await dao.get();
    //   dtoOut.data = { ...appData, relatedObjectsMap: {} };
    // }

    // HDS 2
    return dtoOut;
  }
}

module.exports = new LoadAbl();
