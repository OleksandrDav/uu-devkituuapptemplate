"use strict";
const { UseCaseContext } = require("uu_appg01_server").AppServer;
const { UuTerrClient } = require("uu_territory_clientg01");
const { BusinessBrickObject } = require("uu_businessbrickg02_common");

const TerritoryConstants = require("../constants/territory-constants");
const DtoBuilder = require("./dto-builder");
const { DevKitUuAppTemplateMain: Errors } = require("../api/errors/devkituuapptemplate-main-error");
const Warnings = require("../api/warnings/devkituuapptemplate-main-warning");
const DevKitUuAppTemplateMainConstants = require("../constants/devkituuapptemplate-main-constants");

class DevKitUuAppTemplateMainClient {
  constructor(uuDevKitUuAppTemplate, territoryUri = null, session = null) {
    this.uuDevKitUuAppTemplate = uuDevKitUuAppTemplate;
    this.uri = UseCaseContext.getUri();
    this.territoryUri = territoryUri ? territoryUri : uuDevKitUuAppTemplate.uuTerritoryBaseUri;
    this.session = session ? session : UseCaseContext.getSession();
    this.businessBrickObject = new BusinessBrickObject({
      uuAppTypeCode: DevKitUuAppTemplateMainConstants.UU_OBJECT_TYPE,
    });
  }

  async createAwsc(location, responsibleRole, permissionMatrix, uuAppMetaModelVersion) {
    const appClientOpts = this.getAppClientOpts();
    const { name, desc } = this.uuDevKitUuAppTemplate;
    const awscCreateDtoIn = {
      name,
      desc,
      code: `${DevKitUuAppTemplateMainConstants.AWSC_PREFIX}/${this.uuDevKitUuAppTemplate.awid}`,
      location,
      responsibleRole,
      permissionMatrix,
      typeCode: DevKitUuAppTemplateMainConstants.UUAPP_CODE,
      uuAppWorkspaceUri: this.uri.getBaseUri(),
      uuAppMetaModelVersion,
    };

    let awsc;
    try {
      awsc = await UuTerrClient.Awsc.create(awscCreateDtoIn, appClientOpts);
    } catch (e) {
      const awscCreateErrorMap = (e.dtoOut && e.dtoOut.uuAppErrorMap) || {};

      const isDup =
        awscCreateErrorMap[TerritoryConstants.AWSC_CREATE_FAILED_CODE] &&
        awscCreateErrorMap[TerritoryConstants.AWSC_CREATE_FAILED_CODE].cause &&
        awscCreateErrorMap[TerritoryConstants.AWSC_CREATE_FAILED_CODE].cause[TerritoryConstants.NOT_UNIQUE_ID_CODE];

      if (isDup) {
        DtoBuilder.addWarning(new Warnings.Init.UuAwscAlreadyCreated());
        awsc = await UuTerrClient.Awsc.get(
          { code: `${DevKitUuAppTemplateMainConstants.AWSC_PREFIX}/${this.uuDevKitUuAppTemplate.awid}` },
          appClientOpts,
        );
      } else {
        DtoBuilder.addUuAppErrorMap(awscCreateErrorMap);
        throw new Errors.CreateAwscFailed(
          { uuTerritoryBaseUri: this.uuDevKitUuAppTemplate.uuTerritoryBaseUri, awid: this.uuDevKitUuAppTemplate.awid },
          e,
        );
      }
    }

    const latestObject = await this.businessBrickObject.get({ oid: this.uuDevKitUuAppTemplate.oid });
    this.uuDevKitUuAppTemplate = await this.businessBrickObject.update({
      uuObject: { ...latestObject, artifactId: awsc.id },
      versionCreationStrategy: "updateCurrentVersion",
    });

    return this.uuDevKitUuAppTemplate;
  }

  async loadAwsc() {
    const appClientOpts = this.getAppClientOpts();

    let awsc;
    try {
      awsc = await UuTerrClient.Awsc.load({ id: this.uuDevKitUuAppTemplate.artifactId }, appClientOpts);
    } catch (e) {
      throw new Errors.LoadAwscFailed({ artifactId: this.uuDevKitUuAppTemplate.artifactId }, e);
    }

    return awsc;
  }

  async setAwscState(state) {
    const appClientOpts = this.getAppClientOpts();
    try {
      await UuTerrClient.Awsc.setState(
        {
          id: this.uuDevKitUuAppTemplate.artifactId,
          state,
        },
        appClientOpts,
      );
    } catch (e) {
      throw new Errors.SetAwscStateFailed({ state, id: this.uuDevKitUuAppTemplate.artifactId }, e);
    }
  }

  async deleteAwsc() {
    const appClientOpts = this.getAppClientOpts();
    try {
      await UuTerrClient.Awsc.delete({ id: this.uuDevKitUuAppTemplate.artifactId }, appClientOpts);
    } catch (e) {
      if (e.cause?.code !== TerritoryConstants.ARTIFACT_DOES_NOT_EXIST) {
        throw new Errors.DeleteAwscFailed({ id: this.uuDevKitUuAppTemplate.artifactId }, e);
      }
    }
  }

  async verifyEmptyAwscActivities() {
    const appClientOpts = this.getAppClientOpts();
    const pageInfo = { pageIndex: 0, pageSize: 1 };
    let listActivitiesDtoOut;
    try {
      listActivitiesDtoOut = await UuTerrClient.ArtifactIfc.listActivities(
        { id: this.uuDevKitUuAppTemplate.artifactId, excludeCompleted: true, pageInfo },
        appClientOpts,
      );
    } catch (e) {
      throw new Errors.ArtifactIfcListActivitiesFailed({ id: this.uuDevKitUuAppTemplate.artifactId }, e);
    }

    if (listActivitiesDtoOut.activityList.length) {
      throw new Errors.SomeActivitiesNotCompleted(
        {
          notCompletedActivitiesCount: listActivitiesDtoOut.pageInfo.total,
          artifactId: this.uuDevKitUuAppTemplate.artifactId,
        },
        e,
      );
    }
  }

  getAppClientOpts() {
    return { baseUri: this.territoryUri, session: this.session, appUri: this.uri };
  }
}

module.exports = DevKitUuAppTemplateMainClient;
