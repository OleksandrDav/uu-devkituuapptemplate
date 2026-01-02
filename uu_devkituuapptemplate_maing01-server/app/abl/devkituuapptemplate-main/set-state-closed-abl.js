"use strict";
const Crypto = require("crypto");
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;
const { AuthenticationService } = require("uu_appg01_server").Authentication;
const { UriBuilder } = require("uu_appg01_server").Uri;
const { UuDateTime } = require("uu_i18ng01");
const { ConsoleClient, ProgressClient } = require("uu_consoleg02-uulib");
const { CmdLoaderBuilder } = require("uu_businessbrickg02_lib").Common.Components.Loaders;
const { BusinessBrickObject } = require("uu_businessbrickg02_common");

const Errors = require("../../api/errors/devkituuapptemplate-main-error");
const Warnings = require("../../api/warnings/devkituuapptemplate-main-warning");
const DtoBuilder = require("../../components/dto-builder");
const ScriptEngineClient = require("../../components/script-engine-client");
const DevKitUuAppTemplateMainClient = require("../../components/devkituuapptemplate-main-client");
const StepHandler = require("../../components/step-handler");

const ProgressConstants = require("../../constants/progress-constants");
const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");
const TerritoryConstants = require("../../constants/territory-constants");
const Configuration = require("../../components/configuration");

const SCRIPT_CODE = "uu_devkituuapptemplate_maing01-uuscriptlib/devkituuapptemplate-main/set-state-closed";

class SetStateClosedAbl {
  constructor() {
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
    this.businessBrickObject = new BusinessBrickObject({
      uuAppTypeCode: DevKitUuAppTemplateMainConstants.UU_OBJECT_TYPE,
    });
  }

  async setStateClosed(uri, dtoIn) {
    // HDS 1, 2
    const awid = uri.getAwid();
    const cmdLoader = new CmdLoaderBuilder(dtoIn);
    let { data: uuDevKitUuAppTemplate } = await cmdLoader.loadWorkspaceData();

    if (!uuDevKitUuAppTemplate) {
      // 2.1
      throw new Errors.SetStateClosed.UuDevKitUuAppTemplateDoesNotExist({ awid });
    }

    if (uuDevKitUuAppTemplate.state !== DevKitUuAppTemplateMainConstants.StateMap.ACTIVE) {
      // 2.2
      throw new Errors.SetStateClosed.NotInProperState({
        state: uuDevKitUuAppTemplate.state,
        expectedStateList: [DevKitUuAppTemplateMainConstants.StateMap.ACTIVE],
      });
    }

    if (uuDevKitUuAppTemplate.temporaryData && uuDevKitUuAppTemplate.temporaryData.useCase !== uri.getUseCase()) {
      // 2.3
      throw new Errors.SetStateClosed.UseCaseExecutionForbidden({
        concurrencyUseCase: uuDevKitUuAppTemplate.temporaryData.useCase,
      });
    }

    // HDS 3
    const configuration = await Configuration.getUuSubAppConfiguration({
      awid,
      artifactId: uuDevKitUuAppTemplate.artifactId,
      uuTerritoryBaseUri: uuDevKitUuAppTemplate.uuTerritoryBaseUri,
    });

    // HDS 4
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    await this._ensureConsoleExists(uuDevKitUuAppTemplate, configuration, sysIdentitySession);
    const lockSecret = Crypto.randomBytes(32).toString("hex");
    const progressClient = await this._createSetStateClosedProgress(
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
            dtoIn: {},
            stepList: [DevKitUuAppTemplateMainConstants.SetStateClosedStepMap.CLOSE_STARTED.code],
            progressMap: {
              progressCode: progressClient.progress.code,
              uuConsoleUri: configuration.uuConsoleBaseUri,
              consoleCode: DevKitUuAppTemplateMainConstants.getMainConsoleCode(awid),
            },
          },
        },
      });
    }

    // HDS 6
    const devKitUuAppTemplateMainClient = new DevKitUuAppTemplateMainClient(
      uuDevKitUuAppTemplate,
      uuDevKitUuAppTemplate.uuTerritoryBaseUri,
    );
    await devKitUuAppTemplateMainClient.verifyEmptyAwscActivities();

    // TODO If your application requires any additional steps, add them here...

    // HDS 7
    await this._runScript(uri.getBaseUri(), configuration, progressClient.progress.lockSecret, sysIdentitySession);

    // HDS 8
    return DtoBuilder.prepareDtoOut({ data: uuDevKitUuAppTemplate });
  }

  async _setStateClosedFinalize(uri, dtoIn) {
    const awid = uri.getAwid();
    // HDS 1, 2
    const cmdLoader = new CmdLoaderBuilder(dtoIn);
    let { data: uuDevKitUuAppTemplate } = await cmdLoader.loadWorkspaceData(
      "sysUuAppWorkspaceSetStateClosedFinalizeDtoInType",
    );

    if (!uuDevKitUuAppTemplate) {
      // 2.1
      throw new Errors._setStateClosedFinalize.UuDevKitUuAppTemplateDoesNotExist({ awid });
    }

    if (!uuDevKitUuAppTemplate.state === DevKitUuAppTemplateMainConstants.StateMap.ACTIVE) {
      // 2.2
      throw new Errors._setStateClosedFinalize.NotInProperState({
        state: uuDevKitUuAppTemplate.state,
        expectedStateList: [DevKitUuAppTemplateMainConstants.StateMap.ACTIVE],
      });
    }

    if (!uuDevKitUuAppTemplate.temporaryData) {
      // 2.3
      throw new Errors._setStateClosedFinalize.MissingRequiredData();
    }

    if (
      uuDevKitUuAppTemplate.temporaryData &&
      uuDevKitUuAppTemplate.temporaryData.useCase !== "sys/uuAppWorkspace/setStateClosed"
    ) {
      // 2.4
      throw new Errors._setStateClosedFinalize.UseCaseExecutionForbidden({
        concurrencyUseCase: uuDevKitUuAppTemplate.temporaryData.useCase,
      });
    }

    // HDS 3
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const progress = {
      code: DevKitUuAppTemplateMainConstants.getSetStateClosedProgressCode(uuDevKitUuAppTemplate.awid),
      lockSecret: dtoIn.lockSecret,
    };
    let progressClient = null;
    if (
      !uuDevKitUuAppTemplate.temporaryData.stepList.includes(
        DevKitUuAppTemplateMainConstants.SetStateClosedStepMap.PROGRESS_ENDED.code,
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

    // HDS 4
    uuDevKitUuAppTemplate = await stepHandler.handleStep(
      uuDevKitUuAppTemplate,
      DevKitUuAppTemplateMainConstants.SetStateClosedStepMap.AWSC_CLOSED,
      async () => {
        const devKitUuAppTemplateMainClient = new DevKitUuAppTemplateMainClient(
          uuDevKitUuAppTemplate,
          uuDevKitUuAppTemplate.uuTerritoryBaseUri,
        );
        try {
          await devKitUuAppTemplateMainClient.setAwscState(DevKitUuAppTemplateMainConstants.StateMap.FINAL);
        } catch (e) {
          if (e.cause?.code !== TerritoryConstants.INVALID_ARTIFACT_STATE) {
            throw e;
          } else {
            DtoBuilder.addWarning(new Warnings._setStateClosedFinalize.AwscAlreadyInFinalState());
          }
        }
      },
    );

    // HDS 5
    uuDevKitUuAppTemplate = await stepHandler.handleStep(
      uuDevKitUuAppTemplate,
      DevKitUuAppTemplateMainConstants.SetStateClosedStepMap.PROGRESS_ENDED,
      async () => {
        await progressClient.end({
          state: ProgressConstants.StateMap.COMPLETED,
          message: "Setting closed state finished.",
          expireAt: UuDateTime.now().shift("day", 7),
          doneWork: DevKitUuAppTemplateMainConstants.getSetStateClosedStepCount(),
        });
      },
      false,
    );

    // HDS 6
    uuDevKitUuAppTemplate = await this.businessBrickObject.update({
      uuObject: {
        awid,
        oid: uuDevKitUuAppTemplate.oid,
        state: DevKitUuAppTemplateMainConstants.StateMap.FINAL,
        temporaryData: null,
      },
    });

    // HDS 7
    return DtoBuilder.prepareDtoOut();
  }

  _parseTerritoryUri(locationUri) {
    let uuTerritoryUri;

    try {
      uuTerritoryUri = UriBuilder.parse(locationUri);
    } catch (e) {
      throw new Errors.SetStateClosed.UuTLocationUriParseFailed({ uri: locationUri }, e);
    }

    return uuTerritoryUri;
  }

  async _createSetStateClosedProgress(uuDevKitUuAppTemplate, dtoIn, config, lockSecret, session) {
    const uuTerritoryUri = this._parseTerritoryUri(uuDevKitUuAppTemplate.uuTerritoryBaseUri);

    let progressClient;
    let progress = {
      expireAt: UuDateTime.now().shift("day", 7),
      name: DevKitUuAppTemplateMainConstants.getSetStateClosedProgressName(uuDevKitUuAppTemplate.awid),
      code: DevKitUuAppTemplateMainConstants.getSetStateClosedProgressCode(uuDevKitUuAppTemplate.awid),
      authorizationStrategy: "boundArtifact",
      boundArtifactUri: uuTerritoryUri.setParameter("id", uuDevKitUuAppTemplate.artifactId).toUri().toString(),
      boundArtifactPermissionMatrix: DevKitUuAppTemplateMainConstants.CONSOLE_BOUND_MATRIX,
      lockSecret,
    };

    try {
      progressClient = await ProgressClient.get(config.uuConsoleBaseUri, { code: progress.code }, { session });
    } catch (e) {
      if (e.cause?.code !== ProgressConstants.PROGRESS_DOES_NOT_EXIST) {
        throw new Errors.SetStateClosed.ProgressGetCallFailed({ progressCode: progress.code }, e);
      }
    }

    if (!progressClient) {
      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.SetStateClosed.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    } else if (dtoIn.force) {
      try {
        await progressClient.releaseLock();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_RELEASE_DOES_NOT_EXIST) {
          throw new Errors.SetStateClosed.ProgressReleaseLockCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        await progressClient.setState({ state: "cancelled" });
      } catch (e) {
        DtoBuilder.addWarning(new Warnings.SetStateClosed.ProgressSetStateCallFailed(e.cause?.paramMap));
      }

      try {
        await progressClient.delete();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_DELETE_DOES_NOT_EXIST) {
          throw new Errors.SetStateClosed.ProgressDeleteCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.SetStateClosed.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    }

    try {
      await progressClient.start({
        message: "Progress was started",
        totalWork: DevKitUuAppTemplateMainConstants.getSetStateClosedStepCount(),
        lockSecret,
      });
    } catch (e) {
      throw new Errors.SetStateClosed.ProgressStartCallFailed({ progressCode: progress.code }, e);
    }

    return progressClient;
  }

  async _ensureConsoleExists(uuDevKitUuAppTemplate, configuration, session) {
    const artifactUri = UriBuilder.parse(uuDevKitUuAppTemplate.uuTerritoryBaseUri)
      .setParameter("id", uuDevKitUuAppTemplate.artifactId)
      .toString();
    const console = {
      code: DevKitUuAppTemplateMainConstants.getMainConsoleCode(uuDevKitUuAppTemplate.awid),
      authorizationStrategy: "boundArtifact",
      boundArtifactUri: artifactUri,
      boundArtifactPermissionMatrix: DevKitUuAppTemplateMainConstants.CONSOLE_BOUND_MATRIX,
    };

    try {
      await ConsoleClient.createInstance(configuration.uuConsoleBaseUri, console, { session });
    } catch (e) {
      throw new Errors.Init.FailedToCreateConsole({}, e);
    }
  }

  async _runScript(appUri, configuration, lockSecret, session) {
    const scriptEngineClient = new ScriptEngineClient({
      scriptEngineUri: configuration.uuScriptEngineBaseUri,
      consoleUri: configuration.uuConsoleBaseUri,
      consoleCode: DevKitUuAppTemplateMainConstants.getMainConsoleCode(appUri.getAwid()),
      uuScriptRepositoryBaseUri: configuration.uuScriptRepositoryBaseUri,
      session,
    });

    const scriptDtoIn = {
      uuDevKitUuAppTemplateUri: appUri.toString(),
      lockSecret,
    };

    await scriptEngineClient.runScript({ scriptCode: SCRIPT_CODE, scriptDtoIn });
  }
}

module.exports = new SetStateClosedAbl();
