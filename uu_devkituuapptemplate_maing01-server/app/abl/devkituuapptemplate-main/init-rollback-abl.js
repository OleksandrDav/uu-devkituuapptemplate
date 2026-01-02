"use strict";
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;
const { UuAppWorkspace } = require("uu_appg01_server").Workspace;
const { AuthenticationService } = require("uu_appg01_server").Authentication;
const { ConsoleClient, ProgressClient } = require("uu_consoleg02-uulib");
const { UuTerrClient: UuTerritoryClient } = require("uu_territory_clientg01");
const { BusinessBrickObject } = require("uu_businessbrickg02_common");

const Errors = require("../../api/errors/devkituuapptemplate-main-error");
const Warnings = require("../../api/warnings/devkituuapptemplate-main-warning");
const DtoBuilder = require("../../components/dto-builder");
const TerritoryConstants = require("../../constants/territory-constants");
const ScriptEngineClient = require("../../components/script-engine-client");
const StepHandler = require("../../components/step-handler");
const ConsoleConstants = require("../../constants/console-constants");
const ProgressConstants = require("../../constants/progress-constants");
const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");

const Validator = require("../../components/validator");

class InitRollbackAbl {
  constructor() {
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
    this.businessBrickObject = new BusinessBrickObject({
      uuAppTypeCode: DevKitUuAppTemplateMainConstants.UU_OBJECT_TYPE,
    });
  }

  async initRollback(appUri, configuration, lockSecret) {
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const scriptEngineClient = new ScriptEngineClient({
      scriptEngineUri: configuration.uuScriptEngineBaseUri,
      consoleUri: configuration.uuConsoleBaseUri,
      consoleCode: DevKitUuAppTemplateMainConstants.getMainConsoleCode(appUri.getAwid()),
      uuScriptRepositoryBaseUri: configuration.uuScriptRepositoryBaseUri,
      session: sysIdentitySession,
    });
    const scriptDtoIn = {
      uuDevKitUuAppTemplateUri: appUri.toString(),
      lockSecret,
    };

    return await scriptEngineClient.runScript({
      scriptCode: "uu_devkituuapptemplate_maing01-uuscriptlib/devkituuapptemplate-main/init-rollback",
      scriptDtoIn,
    });
  }

  // Validates dtoIn. In case of standard mode the data key of dtoIn is also validated.
  _validateDtoIn(uri, dtoIn) {
    let uuAppErrorMap = Validator.validateDtoIn(uri, dtoIn);
    if (dtoIn.mode === DevKitUuAppTemplateMainConstants.ModeMap.ROLLBACK) {
      Validator.validateDtoInCustom(uri, dtoIn.data, "sysUuAppWorkspaceInitFinalizeRollbackDtoInType", uuAppErrorMap);
    }
    return uuAppErrorMap;
  }

  async _initFinalizeRollback(uri, dtoIn) {

    console.log(dtoIn)
    
    // HDS 1
    const awid = uri.getAwid();
    const dao = await this.dataStore.getAwidDao(DevKitUuAppTemplateMainConstants.UU_OBJECT_TYPE);
    this._validateDtoIn(uri, dtoIn);

    // HDS 2
    let uuDevKitUuAppTemplate = await dao.getByAwid(awid);

    // HDS 3
    if (!uuDevKitUuAppTemplate) {
      // 3.1
      throw new Errors._initFinalizeRollback.UuDevKitUuAppTemplateDoesNotExist({ awid });
    }

    if (
      ![
        DevKitUuAppTemplateMainConstants.StateMap.BEING_INITIALIZED,
        DevKitUuAppTemplateMainConstants.StateMap.CREATED,
      ].includes(uuDevKitUuAppTemplate.state)
    ) {
      // 3.2
      throw new Errors._initFinalizeRollback.NotInProperState({
        state: uuDevKitUuAppTemplate.state,
        expectedStateList: [
          DevKitUuAppTemplateMainConstants.StateMap.BEING_INITIALIZED,
          DevKitUuAppTemplateMainConstants.StateMap.CREATED,
        ],
      });
    }

    // HDS 4
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const { uuConsoleUri, progressCode, consoleCode } = uuDevKitUuAppTemplate.temporaryData.progressMap;
    let progressClient = null;
    if (
      !uuDevKitUuAppTemplate.temporaryData.rollbackStepList.includes(
        DevKitUuAppTemplateMainConstants.InitRollbackStepMap.PROGRESS_DELETED.code,
      )
    ) {
      progressClient = await ProgressClient.get(
        uuConsoleUri,
        { code: progressCode, lockSecret: dtoIn.lockSecret },
        { session: sysIdentitySession },
      );
    }
    const stepHandler = new StepHandler({
      businessBrickObject: this.businessBrickObject,
      progressClient,
      stepList: uuDevKitUuAppTemplate.temporaryData.rollbackStepList,
      rollbackMode: true,
    });

    // TODO If your application requires any additional steps, add them here...

    // HDS 5
    if (
      uuDevKitUuAppTemplate.temporaryData.stepList.includes(
        DevKitUuAppTemplateMainConstants.InitStepMap.CONSOLE_CREATED.code,
      )
    ) {
      uuDevKitUuAppTemplate = await stepHandler.handleStep(
        uuDevKitUuAppTemplate,
        DevKitUuAppTemplateMainConstants.InitRollbackStepMap.CONSOLE_CLEARED,
        async () => {
          await this._clearConsole(uuConsoleUri, consoleCode, sysIdentitySession);
        },
      );
    }

    // HDS 6
    if (
      uuDevKitUuAppTemplate.temporaryData.stepList.includes(
        DevKitUuAppTemplateMainConstants.InitStepMap.AUTHORIZATION_STRATEGY_SET.code,
      )
    ) {
      uuDevKitUuAppTemplate = await stepHandler.handleStep(
        uuDevKitUuAppTemplate,
        DevKitUuAppTemplateMainConstants.InitRollbackStepMap.WS_DISCONNECTED,
        async () => {
          await UuAppWorkspace.setAuthorizationStrategy(
            uri,
            {
              authorizationStrategy: "roleGroupInterface",
              roleGroupUriMap: {},
            },
            sysIdentitySession,
          );
        },
      );
    }

    // HDS 7
    if (
      uuDevKitUuAppTemplate.temporaryData.stepList.includes(
        DevKitUuAppTemplateMainConstants.InitStepMap.AWSC_CREATED.code,
      )
    ) {
      await stepHandler.handleStep(
        uuDevKitUuAppTemplate,
        DevKitUuAppTemplateMainConstants.InitRollbackStepMap.AWSC_DELETED,
        async () => {
          await this._deleteAwsc(uuDevKitUuAppTemplate, uri, sysIdentitySession);
        },
      );
    }

    // HDS 8
    await stepHandler.handleStep(
      uuDevKitUuAppTemplate,
      DevKitUuAppTemplateMainConstants.InitRollbackStepMap.PROGRESS_DELETED,
      async () => {
        let progressExists = true;
        try {
          await progressClient.end({
            state: ProgressConstants.StateMap.COMPLETED,
            message: "Rollback finished.",
            doneWork: DevKitUuAppTemplateMainConstants.getInitRollbackStepCount(),
          });
        } catch (e) {
          if (e.cause?.code?.endsWith("progressDoesNotExist")) {
            progressExists = false;
            DtoBuilder.addWarning(
              new Warnings._initFinalizeRollback.ProgressDoesNotExist({ code: progressClient.progress.code }),
            );
          } else if (
            e.cause?.code?.endsWith("progressIsNotInProperState") &&
            e.cause.paramMap?.state?.includes("completed")
          ) {
            DtoBuilder.addWarning(
              new Warnings._initFinalizeRollback.ProgressEndCallFailed({
                code: progressClient.progress.code,
                state: e.cause.paramMap.state,
              }),
            );
          } else {
            throw new Errors._initFinalizeRollback.ProgressEndCallFailed({}, e);
          }
        }

        try {
          progressExists &&
            (await progressClient.setState({
              state: ProgressConstants.StateMap.CANCELLED,
            }));
        } catch (e) {
          if (e.cause?.code?.endsWith("progressDoesNotExist")) {
            progressExists = false;
            DtoBuilder.addWarning(
              new Warnings._initFinalizeRollback.ProgressDoesNotExist({ code: progressClient.progress.code }),
            );
          } else if (e.cause?.code?.endsWith("progressIsNotInProperState") && e.cause.paramMap?.state === "cancelled") {
            DtoBuilder.addWarning(
              new Warnings._initFinalizeRollback.ProgressSetStateCallFailed({
                code: progressClient.progress.code,
                state: e.cause.paramMap?.state,
              }),
            );
          } else {
            throw new Errors._initFinalizeRollback.ProgressSetStateCallFailed({}, e);
          }
        }

        try {
          progressExists && (await progressClient.delete());
        } catch (e) {
          if (e.cause?.code?.endsWith("progressDoesNotExist")) {
            DtoBuilder.addWarning(
              new Warnings._initFinalizeRollback.ProgressDoesNotExist({ code: progressClient.progress.code }),
            );
          } else if (e.cause?.code?.endsWith("progressIsNotInProperState")) {
            DtoBuilder.addWarning(
              new Warnings._initFinalizeRollback.ProgressDeleteCallFailed({
                code: progressClient.progress.code,
                state: e.cause.paramMap?.state,
              }),
            );
          } else {
            throw new Errors._initFinalizeRollback.ProgressDeleteCallFailed({}, e);
          }
        }
      },
      false,
    );

    // HDS 9
    await dao.delete(uuDevKitUuAppTemplate);

    // HDS 10
    try {
      await UuAppWorkspace.setAssignedSysState(awid);
    } catch (e) {
      throw new Errors._initFinalizeRollback.SetAssignedSysStateFailed({}, e);
    }

    // HDS 11
    return DtoBuilder.prepareDtoOut();
  }

  async _clearConsole(uuConsoleUri, consoleCode, session) {
    let consoleClient;
    try {
      consoleClient = await ConsoleClient.get(uuConsoleUri, { code: consoleCode }, { session });
    } catch (e) {
      if (e.cause?.code === ConsoleConstants.CONSOLE_GET_DOES_NOT_EXISTS) {
        throw new Errors._initFinalizeRollback.ConsoleGetCallFailed({ code: consoleCode }, e);
      }
    }

    try {
      await consoleClient.clear();
    } catch (e) {
      if (e.cause?.code === ConsoleConstants.CONSOLE_CLEAR_DOES_NOT_EXISTS) {
        DtoBuilder.addWarning(new Warnings._initFinalizeRollback.ConsoleDoesNotExist({ code: consoleCode }));
      } else {
        throw new Errors._initFinalizeRollback.ConsoleClearCallFailed({ code: consoleCode }, e);
      }
    }
  }

  async _deleteAwsc(uuDevKitUuAppTemplate, appUri, session) {
    const appClientOpts = { baseUri: uuDevKitUuAppTemplate.uuTerritoryBaseUri, appUri, session };

    try {
      await UuTerritoryClient.Awsc.setState(
        {
          id: uuDevKitUuAppTemplate.artifactId,
          state: DevKitUuAppTemplateMainConstants.StateMap.FINAL,
        },
        appClientOpts,
      );
    } catch (e) {
      let throwError = true;

      switch (e.code) {
        case TerritoryConstants.ARTIFACT_DOES_NOT_EXIST:
          // 5.1.1.
          throwError = false;
          DtoBuilder.addWarning(new Warnings._initFinalizeRollback.UuAwscDoesNotExist());
          break;

        case TerritoryConstants.INVALID_ARTIFACT_STATE:
          if (e.paramMap?.artifactState === DevKitUuAppTemplateMainConstants.StateMap.FINAL) {
            // 5.1.2.
            throwError = false;
            DtoBuilder.addWarning(new Warnings._initFinalizeRollback.UuAwscDoesNotExist());
          }
          break;
      }

      if (throwError) {
        // 5.1.3.
        throw new Errors.DevKitUuAppTemplateMain.SetAwscStateFailed({}, e);
      }
    }

    try {
      await UuTerritoryClient.Awsc.delete({ id: uuDevKitUuAppTemplate.artifactId }, appClientOpts);
    } catch (e) {
      if (e.code === TerritoryConstants.ARTIFACT_DOES_NOT_EXIST) {
        // 5.2.1.
        DtoBuilder.addWarning(new Warnings._initFinalizeRollback.UuAwscDoesNotExist());
      } else {
        // 5.2.2.
        throw new Errors.DevKitUuAppTemplateMain.DeleteAwscFailed({}, e);
      }
    }
  }
}

module.exports = new InitRollbackAbl();
