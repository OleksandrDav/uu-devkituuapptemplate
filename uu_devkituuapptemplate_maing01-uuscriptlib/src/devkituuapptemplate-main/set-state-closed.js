"use strict";

const { Uri } = require("uu_appg01_server").Uri;

// eslint-disable-next-line no-undef
scriptContext.dtoOut = { uuAppErrorMap: {} };
// eslint-disable-next-line no-undef
let { dtoIn, console, dtoOut, session } = scriptContext;

/*@@viewOn:imports*/
const { Validator } = require("uu_appg01_server").Validation;
const { ValidationHelper } = require("uu_appg01_server").AppServer;
const { UseCaseError } = require("uu_appg01_server").AppServer;
const { ProgressClient } = require("uu_consoleg02-uulib");
const { UuTerrClient } = require("uu_territory_clientg01");

const DevKitUuAppTemplateMainClient = uuScriptRequire(
  "uu_devkituuapptemplate_maing01-uuscriptlib/devkituuapptemplate-main-client",
  {
    scriptRequireCacheEnabled: false,
  },
);
const HistorizableObjectClient = uuScriptRequire(
  "uu_devkituuapptemplate_maing01-uuscriptlib/historizable-object-client",
  {
    scriptRequireCacheEnabled: false,
  },
);
/*@@viewOff:imports*/

/*@@viewOn:names*/
const Names = {
  SCRIP_LIB_NAME: "uu_devkituuapptemplate_maing01-uuscriptlib",
  SCRIPT_NAME: "DevKitUuAppTemplateMainSetStateClosed",
};
/*@@viewOff:names*/

/*@@viewOn:constants*/
const CMD_NAME = "setStateClosed";
/*@@viewOff:constants*/

/*@@viewOn:errors*/
const Errors = {
  ERROR_PREFIX: `${Names.SCRIP_LIB_NAME}/${Names.SCRIPT_NAME}/`,

  InvalidDtoIn: class extends UseCaseError {
    constructor(dtoOut, paramMap, cause = null) {
      if (paramMap instanceof Error) {
        cause = paramMap;
        paramMap = {};
      }
      super({ dtoOut, paramMap, status: 400 }, cause);
      this.message = "DtoIn is not valid.";
      this.code = `${Errors.ERROR_PREFIX}invalidDtoIn`;
    }
  },
};
/*@@viewOff:errors*/

/*@@viewOn:scriptClient*/
class DevKitUuAppTemplateMainSetStateClosedClient {
  constructor(lockSecret) {
    this.lockSecret = lockSecret;
    this.progressClient = null;
    this.DevKitUuAppTemplateClient = null;
    this.uuDevKitUuAppTemplate = null;
  }

  async start() {
    this.DevKitUuAppTemplateClient = new DevKitUuAppTemplateMainClient(dtoIn.uuDevKitUuAppTemplateUri);
    this.historizableObjectClient = new HistorizableObjectClient(dtoIn.uuDevKitUuAppTemplateUri);
    this.uuDevKitUuAppTemplate = await this.DevKitUuAppTemplateClient.load();
    this.progressClient = await ProgressClient.createInstance(
      this.uuDevKitUuAppTemplate.data.temporaryData.progressMap.uuConsoleUri,
      {
        code: this.uuDevKitUuAppTemplate.data.temporaryData.progressMap.progressCode,
        lockSecret: this.lockSecret,
      },
      { session },
    );

    return this.uuDevKitUuAppTemplate;
  }

  async closeHistorizableObject() {
    const historizableObjectList = await this.historizableObjectClient.list();
    await console.info(`There are ${historizableObjectList.itemList?.length} historizableObject objects to be closed.`);
    const uuTerritoryUri = Uri.parse(this.uuDevKitUuAppTemplate.data.uuTerritoryBaseUri).getBaseUri();
    const appTokenOpts = { baseUri: uuTerritoryUri, session };
    for (let historizableObject of historizableObjectList.itemList) {
      const activityListDto = await UuTerrClient.ArtifactIfc.listActivities(
        { id: historizableObject.artifactId, excludeCompleted: true },
        appTokenOpts,
      );
      await console.info(`Closing activities of ${historizableObject.name}.`);
      for (let activity of activityListDto.activityList) {
        await UuTerrClient.ArtifactIfc.Activity.setState(
          { id: activity.artifact, activity: activity.id, activityState: "closedBySystem" },
          appTokenOpts,
        );
      }
      await this.historizableObjectClient.setStateClosed({ oid: historizableObject.oid });
    }
    await console.info(`All historizableObject objects are closed.`);
  }

  async closeDevKitUuAppTemplateActivities() {
    const uuTerritoryUri = Uri.parse(this.uuDevKitUuAppTemplate.data.uuTerritoryBaseUri).getBaseUri();
    const appTokenOpts = { baseUri: uuTerritoryUri, session };
    const activityListDto = await UuTerrClient.ArtifactIfc.listActivities(
      { id: this.uuDevKitUuAppTemplate.data.artifactId, excludeCompleted: true },
      appTokenOpts,
    );
    await console.info(`Closing activities of uuDevKitUuAppTemplate.`);
    for (let activity of activityListDto.activityList) {
      await UuTerrClient.ArtifactIfc.Activity.setState(
        { id: activity.artifact, activity: activity.id, activityState: "closedBySystem" },
        appTokenOpts,
      );
    }
  }

  async setStateClosedFinalize() {
    return this.DevKitUuAppTemplateClient.setStateClosedFinalize(this.lockSecret);
  }
}
/*@@viewOff:scriptClient*/

/*@@viewOn:validateDtoIn*/
const DtoInValidationSchema = `const scriptDevKitUuAppTemplateMainSetStateClosedDtoInType = shape({
  uuDevKitUuAppTemplateUri: string().isRequired(),
  lockSecret: hexa64Code().isRequired(),
})`;

function validateDtoIn(dtoIn, uuAppErrorMap = {}) {
  let dtoInValidator = new Validator(DtoInValidationSchema, true);
  let validationResult = dtoInValidator.validate("scriptDevKitUuAppTemplateMainSetStateClosedDtoInType", dtoIn);
  return ValidationHelper.processValidationResult(
    dtoIn,
    validationResult,
    uuAppErrorMap,
    `${Errors.ERROR_PREFIX}unsupportedKeys`,
    Errors.InvalidDtoIn,
  );
}
/*@@viewOff:validateDtoIn*/

/*@@viewOn:helpers*/
/*@@viewOff:helpers*/

async function main() {
  await console.info(`Script uuDevKitUuAppTemplate set state closed started`);
  dtoOut.dtoIn = dtoIn;
  const uuAppErrorMap = dtoOut.uuAppErrorMap;

  // validates dtoIn
  await console.info(`Validating dtoIn schema.`);
  await console.info(JSON.stringify(dtoIn));

  validateDtoIn(dtoIn, uuAppErrorMap);

  // initialization uuDevKitUuAppTemplate client and variables
  let mainContext = new DevKitUuAppTemplateMainSetStateClosedClient(dtoIn.lockSecret);
  let uuDevKitUuAppTemplate = await mainContext.start();

  await console.log(
    `<uu5string/><UuConsole.Progress baseUri='${Uri.parse(scriptContext.scriptRuntime.getScriptConsoleUri()).baseUri}' progressCode='${mainContext.progressClient.progress.code}' />`,
  );

  await mainContext.closeHistorizableObject();

  await mainContext.closeDevKitUuAppTemplateActivities();
  // TODO Add steps your application needs here...

  uuDevKitUuAppTemplate = await mainContext.setStateClosedFinalize();

  return { data: uuDevKitUuAppTemplate, uuAppErrorMap };
}

main();
