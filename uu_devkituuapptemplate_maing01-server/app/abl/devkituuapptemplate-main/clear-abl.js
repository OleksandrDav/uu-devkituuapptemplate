"use strict";
const Crypto = require("crypto");
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;
const { UuAppWorkspace } = require("uu_appg01_server").Workspace;
const { AuthenticationService } = require("uu_appg01_server").Authentication;
const { UuDateTime } = require("uu_i18ng01");
const { ConsoleClient, ProgressClient } = require("uu_consoleg02-uulib");
const { CmdLoaderBuilder } = require("uu_businessbrickg02_lib").Common.Components.Loaders;
const { BusinessBrickObject } = require("uu_businessbrickg02_common");
const { BusinessBrickIntegrator } = require("uu_businessbrickg02_lib").Common.Components;

const AppWorkspaceAbl = require("uu_appg01_workspace/src/abl/sys-app-workspace-abl");
const Errors = require("../../api/errors/devkituuapptemplate-main-error");
const Warnings = require("../../api/warnings/devkituuapptemplate-main-warning");
const Validator = require("../../components/validator");
const DtoBuilder = require("../../components/dto-builder");
const ScriptEngineClient = require("../../components/script-engine-client");
const DevKitUuAppTemplateMainClient = require("../../components/devkituuapptemplate-main-client");
const StepHandler = require("../../components/step-handler");

const ProgressConstants = require("../../constants/progress-constants");
const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");
const Configuration = require("../../components/configuration");

const SCRIPT_CODE = "uu_devkituuapptemplate_maing01-uuscriptlib/devkituuapptemplate-main/clear";

class ClearAbl {
  constructor() {
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
    this.businessBrickObject = new BusinessBrickObject({
      uuAppTypeCode: DevKitUuAppTemplateMainConstants.UU_OBJECT_TYPE,
    });
  }

  async clear(uri, dtoIn) {
    // HDS 1, 2
    const awid = uri.getAwid();
    const cmdLoader = new CmdLoaderBuilder(dtoIn);
    let { data: uuDevKitUuAppTemplate } = await cmdLoader.loadWorkspaceData();

    if (uuDevKitUuAppTemplate) {
      if (uuDevKitUuAppTemplate.state !== DevKitUuAppTemplateMainConstants.StateMap.FINAL) {
        // 2.1
        throw new Errors.Clear.NotInProperState({
          state: uuDevKitUuAppTemplate.state,
          expectedStateList: [DevKitUuAppTemplateMainConstants.StateMap.FINAL],
        });
      }

      if (uuDevKitUuAppTemplate.temporaryData && uuDevKitUuAppTemplate.temporaryData.useCase !== uri.getUseCase()) {
        // 2.2
        throw new Errors.SetStateClosed.UseCaseExecutionForbidden({
          concurrencyUseCase: uuDevKitUuAppTemplate.temporaryData.useCase,
        });
      }
    } else {
      try {
        await UuAppWorkspace.setAssignedSysState(awid);
      } catch (e) {
        // 2.3
        throw new Errors.Clear.SetAssignedSysStateFailed({}, e);
      }

      return DtoBuilder.prepareDtoOut({ progressMap: {} });
    }

    // HDS 3
    const configuration = await Configuration.getUuSubAppConfiguration({
      awid,
      artifactId: uuDevKitUuAppTemplate.artifactId,
      uuTerritoryBaseUri: uuDevKitUuAppTemplate.uuTerritoryBaseUri,
    });

    // HDS 4
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const lockSecret = Crypto.randomBytes(32).toString("hex");
    const progressClient = await this._createClearProgress(
      uuDevKitUuAppTemplate,
      dtoIn,
      configuration,
      lockSecret,
      sysIdentitySession,
    );

    // HDS 5
    if (!uuDevKitUuAppTemplate.temporaryData) {
      uuDevKitUuAppTemplate = await this.businessBrickObject.update({
        uuObject: {
          ...uuDevKitUuAppTemplate,
          awid,
          oid: uuDevKitUuAppTemplate.oid,
          temporaryData: {
            useCase: uri.getUseCase(),
            dtoIn: dtoIn.data,
            stepList: [DevKitUuAppTemplateMainConstants.ClearStepMap.CLEAR_STARTED.code],
            progressMap: {
              progressCode: progressClient.progress.code,
              uuConsoleUri: configuration.uuConsoleBaseUri,
              consoleCode: DevKitUuAppTemplateMainConstants.getMainConsoleCode(awid),
            },
          },
        },
      });
    }

    if (
      uuDevKitUuAppTemplate.temporaryData.stepList.includes(
        DevKitUuAppTemplateMainConstants.ClearStepMap.CONSOLE_CLEARED.code,
      )
    ) {
      await this._clearFinalize(uri, { lockSecret });
    } else {
      // TODO If your application requires any additional steps, add them here...

      // HDS 6
      await this._runScript(
        uri.getBaseUri(),
        uuDevKitUuAppTemplate,
        configuration,
        progressClient.progress.lockSecret,
        sysIdentitySession,
      );
    }

    // HDS 7
    return DtoBuilder.prepareDtoOut({ data: uuDevKitUuAppTemplate });
  }

  async _clearFinalize(uri, dtoIn) {
    // HDS 1
    const awid = uri.getAwid();
    Validator.validateDtoInCustom(uri, dtoIn, "sysUuAppWorkspaceInitFinalizeDtoInType");

    // HDS 2
    const dao = await this.dataStore.getAwidDao(DevKitUuAppTemplateMainConstants.Schemas.DEVKITUUAPPTEMPLATE_INSTANCE);
    let uuDevKitUuAppTemplate = await dao.getByAwid(awid);

    if (!uuDevKitUuAppTemplate) {
      // 2.1
      throw new Errors._clearFinalize.UuDevKitUuAppTemplateDoesNotExist({ awid });
    }

    if (uuDevKitUuAppTemplate.state !== DevKitUuAppTemplateMainConstants.StateMap.FINAL) {
      // 2.2
      throw new Errors._clearFinalize.NotInProperState({
        state: uuDevKitUuAppTemplate.state,
        expectedStateList: [DevKitUuAppTemplateMainConstants.StateMap.FINAL],
      });
    }

    if (!uuDevKitUuAppTemplate.temporaryData) {
      // 2.3
      throw new Errors._clearFinalize.MissingRequiredData();
    }

    if (
      uuDevKitUuAppTemplate.temporaryData &&
      uuDevKitUuAppTemplate.temporaryData.useCase !== "sys/uuAppWorkspace/clear"
    ) {
      // 2.4
      throw new Errors._clearFinalize.UseCaseExecutionForbidden({
        concurrencyUseCase: uuDevKitUuAppTemplate.temporaryData.useCase,
      });
    }

    // HDS 3
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const progress = {
      code: DevKitUuAppTemplateMainConstants.getClearProgressCode(uuDevKitUuAppTemplate.awid),
      lockSecret: dtoIn.lockSecret,
    };
    let progressClient = null;
    if (
      !uuDevKitUuAppTemplate.temporaryData.stepList.includes(
        DevKitUuAppTemplateMainConstants.ClearStepMap.PROGRESS_ENDED.code,
      )
    ) {
      progressClient = await ProgressClient.get(
        uuDevKitUuAppTemplate.temporaryData.progressMap.uuConsoleUri,
        progress,
        {
          session: sysIdentitySession,
        },
      );
    }
    const stepHandler = new StepHandler({
      businessBrickObject: this.businessBrickObject,
      progressClient,
      stepList: uuDevKitUuAppTemplate.temporaryData.stepList,
    });

    // TODO If your application requires any additional steps, add them here...

    // HDS 5
    uuDevKitUuAppTemplate = await stepHandler.handleStep(
      uuDevKitUuAppTemplate,
      DevKitUuAppTemplateMainConstants.ClearStepMap.INIT_PROGRESS_DELETED,
      async () => {
        await this._deleteProgress(
          DevKitUuAppTemplateMainConstants.getInitProgressCode(awid),
          uuDevKitUuAppTemplate.temporaryData.progressMap.uuConsoleUri,
          sysIdentitySession,
        );
      },
    );

    // HDS 6
    uuDevKitUuAppTemplate = await stepHandler.handleStep(
      uuDevKitUuAppTemplate,
      DevKitUuAppTemplateMainConstants.ClearStepMap.SET_STATE_CLOSED_PROGRESS_DELETED,
      async () => {
        await this._deleteProgress(
          DevKitUuAppTemplateMainConstants.getSetStateClosedProgressCode(awid),
          uuDevKitUuAppTemplate.temporaryData.progressMap.uuConsoleUri,
          sysIdentitySession,
        );
      },
    );

    // HDS 7
    uuDevKitUuAppTemplate = await stepHandler.handleStep(
      uuDevKitUuAppTemplate,
      DevKitUuAppTemplateMainConstants.ClearStepMap.CONSOLE_CLEARED,
      async () => {
        await this._clearConsole(
          uuDevKitUuAppTemplate.temporaryData.progressMap.uuConsoleUri,
          DevKitUuAppTemplateMainConstants.getMainConsoleCode(awid),
          sysIdentitySession,
        );
      },
    );

    // HDS 8
    uuDevKitUuAppTemplate = await stepHandler.handleStep(
      uuDevKitUuAppTemplate,
      DevKitUuAppTemplateMainConstants.ClearStepMap.AUTH_STRATEGY_UNSET,
      async () => {
        await dao.cleanWorkspaceAuthStrategy(awid, uuDevKitUuAppTemplate.temporaryData?.dtoIn?.awidInitiatorList);
        AppWorkspaceAbl.clearCache();
      },
    );

    // HDS 9
    uuDevKitUuAppTemplate = await stepHandler.handleStep(
      uuDevKitUuAppTemplate,
      DevKitUuAppTemplateMainConstants.ClearStepMap.AWSC_DELETED,
      async () => {
        const devKitUuAppTemplateMainClient = new DevKitUuAppTemplateMainClient(
          uuDevKitUuAppTemplate,
          uuDevKitUuAppTemplate.uuTerritoryBaseUri,
        );
        await devKitUuAppTemplateMainClient.deleteAwsc();
      },
    );

    // HDS 10
    await BusinessBrickIntegrator.clearByAwid(awid);

    // HDS 11
    uuDevKitUuAppTemplate = await stepHandler.handleStep(
      uuDevKitUuAppTemplate,
      DevKitUuAppTemplateMainConstants.ClearStepMap.PROGRESS_ENDED,
      async () => {
        await progressClient.end({
          state: ProgressConstants.StateMap.COMPLETED,
          message: "Clear finished.",
          expireAt: UuDateTime.now().shift("day", 1),
          doneWork: DevKitUuAppTemplateMainConstants.getSetStateClosedStepCount(),
        });
      },
      false,
    );

    // HDS 12
    if (uuDevKitUuAppTemplate.temporaryData?.dtoIn?.awidInitiatorList) {
      await UuAppWorkspace.reassign({
        awid,
        awidInitiatorList: uuDevKitUuAppTemplate.temporaryData.dtoIn.awidInitiatorList,
      });
    }

    // HDS 13
    await dao._deleteMany({ awid });

    // HDS 14
    try {
      await UuAppWorkspace.setAssignedSysState(awid);
    } catch (e) {
      throw new Errors._clearFinalize.SetAssignedSysStateFailed({}, e);
    }

    // HDS 15
    return DtoBuilder.prepareDtoOut();
  }

  async _createClearProgress(uuDevKitUuAppTemplate, dtoIn, config, lockSecret, session) {
    let progressClient;
    let progress = {
      expireAt: UuDateTime.now().shift("day", 7),
      name: DevKitUuAppTemplateMainConstants.getClearProgressName(uuDevKitUuAppTemplate.awid),
      code: DevKitUuAppTemplateMainConstants.getClearProgressCode(uuDevKitUuAppTemplate.awid),
      authorizationStrategy: "uuIdentityList",
      permissionMap: await this._getClearProgressPermissionMap(
        uuDevKitUuAppTemplate.awid,
        uuDevKitUuAppTemplate.temporaryData?.dtoIn?.awidInitiatorList,
        session,
      ),
      lockSecret,
    };

    try {
      progressClient = await ProgressClient.get(config.uuConsoleBaseUri, { code: progress.code }, { session });
    } catch (e) {
      if (e.cause?.code !== ProgressConstants.PROGRESS_DOES_NOT_EXIST) {
        throw new Errors.Clear.ProgressGetCallFailed({ progressCode: progress.code }, e);
      }
    }

    if (!progressClient) {
      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.Clear.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    } else if (dtoIn.force) {
      try {
        await progressClient.releaseLock();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_RELEASE_DOES_NOT_EXIST) {
          throw new Errors.Clear.ProgressReleaseLockCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        await progressClient.setState({ state: "cancelled" });
      } catch (e) {
        DtoBuilder.addWarning(new Warnings.Clear.ProgressSetStateCallFailed(e.cause?.paramMap));
      }

      try {
        await progressClient.delete();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_DELETE_DOES_NOT_EXIST) {
          throw new Errors.Clear.ProgressDeleteCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.Clear.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    }

    try {
      await progressClient.start({
        message: "Progress was started",
        totalWork: DevKitUuAppTemplateMainConstants.getClearStepCount(),
        lockSecret,
      });
    } catch (e) {
      throw new Errors.Clear.ProgressStartCallFailed({ progressCode: progress.code }, e);
    }

    return progressClient;
  }

  async _getClearProgressPermissionMap(awid, awidInitiatorList, sysIdentitySession) {
    const awidData = await UuAppWorkspace.get(awid);

    let permissionMap = {};
    for (let identity of Array.from(
      new Set([...awidData.awidInitiatorList, ...(awidInitiatorList ? awidInitiatorList : [])]),
    )) {
      permissionMap[identity] = DevKitUuAppTemplateMainConstants.CONSOLE_BOUND_MATRIX.Authorities;
    }
    permissionMap[sysIdentitySession.getIdentity().getUuIdentity()] =
      DevKitUuAppTemplateMainConstants.CONSOLE_BOUND_MATRIX.Authorities;

    return permissionMap;
  }

  async _deleteProgress(progressCode, uuConsoleBaseUri, session) {
    let progressClient;

    try {
      progressClient = await ProgressClient.get(uuConsoleBaseUri, { code: progressCode }, { session });
    } catch (e) {
      if (e.cause?.code === ProgressConstants.PROGRESS_DOES_NOT_EXIST) {
        return;
      } else {
        throw new Errors.Clear.ProgressGetCallFailed({ code: progressCode }, e);
      }
    }

    try {
      await progressClient.setState({ state: "final" });
      await progressClient.delete();
    } catch (e) {
      DtoBuilder.addWarning(new Warnings._clearFinalize.FailedToDeleteProgress(e.parameters));
    }
  }

  async _clearConsole(uuConsoleBaseUri, consoleCode, session) {
    const consoleClient = new ConsoleClient(uuConsoleBaseUri, { code: consoleCode }, { session });

    try {
      await consoleClient.clear();
    } catch (e) {
      console.log(e);
      DtoBuilder.addWarning(new Warnings._clearFinalize.FailedToClearConsole({ code: consoleCode }));
    }
  }

  async _runScript(appUri, uuDevKitUuAppTemplate, configuration, lockSecret, session) {
    const scriptEngineClient = new ScriptEngineClient({
      scriptEngineUri: configuration.uuScriptEngineBaseUri,
      consoleUri: configuration.uuConsoleBaseUri,
      consoleCode: DevKitUuAppTemplateMainConstants.getMainConsoleCode(appUri.getAwid()),
      uuScriptRepositoryBaseUri: configuration.uuScriptRepositoryBaseUri,
      session,
    });

    const scriptDtoIn = {
      uuDevKitUuAppTemplateUri: appUri.toString(),
      awidInitiatorList: uuDevKitUuAppTemplate.temporaryData?.dtoIn?.awidInitiatorList,
      lockSecret,
    };

    await scriptEngineClient.runScript({ scriptCode: SCRIPT_CODE, scriptDtoIn });
  }
}

module.exports = new ClearAbl();
