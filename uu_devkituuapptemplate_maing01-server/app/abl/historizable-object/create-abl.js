"use strict";
const { Uri } = require("uu_appg01_server").Uri;
const { UriBuilder } = require("uu_appg01_server").Uri;
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;
const { AuthenticationService } = require("uu_appg01_server").Authentication;
const AppClient = require("uu_appg01_server").AppClient;

const { UuTerrClient } = require("uu_territory_clientg01");

const { CmdLoaderBuilder } = require("uu_businessbrickg02_lib").Common.Components.Loaders;
const { BusinessBrickObject } = require("uu_businessbrickg02_common");
const { BusinessBrickIntegrator } = require("uu_businessbrickg02_lib").Common.Components;

const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");
const HistorizableObjectConstants = require("../../constants/historizable-object-constants");

// const Errors = require("../../api/errors/historizable-object-error.js");

// const WARNINGS = {
//   createUnsupportedKeys: {
//     code: `${Errors.Create.UC_CODE}unsupportedKeys`,
//     message: "DtoIn contains unsupported keys.",
//   },
//   _createFinalizeUnsupportedKeys: {
//     code: `${Errors._CreateFinalize.UC_CODE}unsupportedKeys`,
//     message: "DtoIn contains unsupported keys.",
//   },
//   _createFinalizeRollbackUnsupportedKeys: {
//     code: `${Errors._CreateFinalizeRollback.UC_CODE}unsupportedKeys`,
//     message: "DtoIn contains unsupported keys.",
//   },
// };

class CreateAbl {
  constructor() {
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
    this.businessBrickObject = new BusinessBrickObject({ uuAppTypeCode: HistorizableObjectConstants.UU_OBJECT_TYPE });
  }

  async create(uri, dtoIn, session, uuAppErrorMap = {}) {
    // HDS 1. - System call workspace loader from uuBusinessBricks
    const awid = uri.getAwid();
    const cmdLoader = new CmdLoaderBuilder(uri, dtoIn, session, uuAppErrorMap)
      .addDtoInValidation("historizableObjectCreateDtoInType")
      .addWorkspaceLoader();
    // 1.1, 1.2
    const loaderResult = await cmdLoader.loadAll();
    let { workspaceObject: uuDevKitUuAppTemplate } = loaderResult;

    const uuTerritoryUri = Uri.parse(uuDevKitUuAppTemplate.uuTerritoryBaseUri).getBaseUri();
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const appTokenOpts = { baseUri: uuTerritoryUri, session };

    // load environment
    const uuAwscEnvironment = await UuTerrClient.Awsc.loadEnvironment(
      { id: uuDevKitUuAppTemplate.artifactId },
      appTokenOpts,
    );

    // create historizableObject object
    let historizableObject = await this.businessBrickObject.create({
      uuObject: {
        awid,
        state: HistorizableObjectConstants.StateMap.ACTIVE,
        uuTerritoryBaseUri: uuTerritoryUri.toString(),
        name: dtoIn.name,
        desc: dtoIn.desc,
      },
    });

    // create folder if necessary
    // TODO - prepare standard how to create folder / where to store folder for historizableObject artifacts
    // FIXME - now historizableObject will be created to the same folder as awsc is
    const locationId = uuAwscEnvironment.folder.id;

    // create historizableObject atc
    const historizableObjectDetailUri = UriBuilder.parse(uri)
      .setUseCase(HistorizableObjectConstants.DETAIL_UC)
      .setParameters({ oid: historizableObject.id.toString() })
      .toUri();

    const uuAtc = await UuTerrClient.Obc.create(
      {
        name: historizableObject.name,
        desc: historizableObject.desc,
        state: historizableObject.state,
        location: locationId,
        uuObId: historizableObject.id.toString(),
        uuObUri: historizableObjectDetailUri.toString(),
        typeCode: HistorizableObjectConstants.UUAPP_TYPE,
        loadContext: true,
      },
      appTokenOpts,
    );
    historizableObject.artifactId = uuAtc.data.artifact.id;

    // integrate business brick
    historizableObject = await BusinessBrickIntegrator.integrateBusinessBrick({
      uuBusinessBrick: historizableObject,
      uuType: HistorizableObjectConstants.UUAPP_TYPE,
      uuAppTypeCode: HistorizableObjectConstants.UU_OBJECT_TYPE,
      integrationOptions: {
        createEbcCollections: true,
        createEccDocument: true,
        createEscCollection: true,
      },
      uri,
      session: sysIdentitySession,
    });

    // update historizableObject object
    historizableObject = await this.businessBrickObject.update({
      uuObject: { ...historizableObject },
      versionCreationStrategy: "updateCurrentVersion",
    });

    // TEMP - it is not possible to fill all sections of business brick during creation
    // fill in default value of uuDevKitUuAppTemplate page content
    const appClient = new AppClient({ baseUri: uri.getBaseUri(), session: sysIdentitySession });

    // set top section
    await appClient.cmdPost("historizableObject/ecc/page/setTopSectionData", {
      oid: historizableObject.oid,
      uuEccData: {
        pageOid: historizableObject.uuEccData.pageOid,
        content: "<uu5string/><UuArtifactCore.PageTopSection/>",
      },
    });

    // HDS 7
    return {
      // ...controlObject,
      data: { ...historizableObject },
      uuAtc,
      uuAwscEnvironment,
      uuAppErrorMap,
    };
  }
}

module.exports = new CreateAbl();
