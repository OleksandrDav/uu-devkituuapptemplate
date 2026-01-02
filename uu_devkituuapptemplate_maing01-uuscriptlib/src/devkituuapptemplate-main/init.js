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

const DevKitUuAppTemplateMainClient = uuScriptRequire(
  "uu_devkituuapptemplate_maing01-uuscriptlib/devkituuapptemplate-main-client",
  {
    scriptRequireCacheEnabled: false,
  },
);
/*@@viewOff:imports*/

/*@@viewOn:names*/
const Names = {
  SCRIP_LIB_NAME: "uu_devkituuapptemplate_maing01-uuscriptlib",
  SCRIPT_NAME: "DevKitUuAppTemplateMainInit",
};
/*@@viewOff:names*/

/*@@viewOn:constants*/
const CMD_NAME = "init";
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
class DevKitUuAppTemplateMainInitClient {
  constructor(lockSecret) {
    this.lockSecret = lockSecret;
    this.progressClient = null;
    this.DevKitUuAppTemplateClient = null;
    this.uuDevKitUuAppTemplate = null;
  }

  async start() {
    this.DevKitUuAppTemplateClient = new DevKitUuAppTemplateMainClient(dtoIn.uuDevKitUuAppTemplateUri);
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

  async initFinalize() {
    return this.DevKitUuAppTemplateClient.initFinalize(this.lockSecret);
  }
}
/*@@viewOff:scriptClient*/

/*@@viewOn:validateDtoIn*/
const DtoInValidationSchema = `const scriptDevKitUuAppTemplateMainInitDtoInType = shape({
  uuDevKitUuAppTemplateUri: string().isRequired(),
  lockSecret: hexa64Code().isRequired(),
})`;

function validateDtoIn(dtoIn, uuAppErrorMap = {}) {
  let dtoInValidator = new Validator(DtoInValidationSchema, true);
  let validationResult = dtoInValidator.validate("scriptDevKitUuAppTemplateMainInitDtoInType", dtoIn);
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
  await console.info(`Script uuDevKitUuAppTemplate init started`);
  dtoOut.dtoIn = dtoIn;
  const uuAppErrorMap = dtoOut.uuAppErrorMap;

  // validates dtoIn
  await console.info(`Validating dtoIn schema.`);
  await console.info(JSON.stringify(dtoIn));

  validateDtoIn(dtoIn, uuAppErrorMap);

  // initialization uuDevKitUuAppTemplate client and variables
  let mainContext = new DevKitUuAppTemplateMainInitClient(dtoIn.lockSecret);
  let uuDevKitUuAppTemplate = await mainContext.start();

  await console.log(
    `<uu5string/><UuConsole.Progress baseUri='${Uri.parse(scriptContext.scriptRuntime.getScriptConsoleUri()).baseUri}' progressCode='${mainContext.progressClient.progress.code}' />`,
  );

  // TODO Add steps your application needs here...

  uuDevKitUuAppTemplate = await mainContext.initFinalize();

  return { data: uuDevKitUuAppTemplate, uuAppErrorMap };
}

main();
