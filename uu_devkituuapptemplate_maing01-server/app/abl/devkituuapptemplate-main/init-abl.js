"use strict";
const Crypto = require("crypto");
const { UuAppDataStoreManager } = require("uu_appg01_server").UuAppDataStoreg02;
const { UuAppWorkspace } = require("uu_appg01_server").Workspace;
const { AuthenticationService } = require("uu_appg01_server").Authentication;
const { UriBuilder } = require("uu_appg01_server").Uri;
const { UuDateTime } = require("uu_i18ng01");
const { ConsoleClient, ProgressClient } = require("uu_consoleg02-uulib");
const { Config } = require("uu_appg01_server").Utils;
const { ProductInfo } = require("uu_apprepresentationg01");
const { BusinessBrickIntegrator } = require("uu_businessbrickg02_lib").Common.Components;
const { BusinessBrickObject } = require("uu_businessbrickg02_common");

// TEMP appClient to be able to fill in default page data
// const AppClient = require("uu_appg01_server").AppClient;

const Fs = require("node:fs/promises");
const Path = require("node:path");

const Errors = require("../../api/errors/devkituuapptemplate-main-error");
const Warnings = require("../../api/warnings/devkituuapptemplate-main-warning");
const Validator = require("../../components/validator");
const DtoBuilder = require("../../components/dto-builder");
const ScriptEngineClient = require("../../components/script-engine-client");
const DevKitUuAppTemplateMainClient = require("../../components/devkituuapptemplate-main-client");
const StepHandler = require("../../components/step-handler");
const InitRollbackAbl = require("./init-rollback-abl");

const ConsoleConstants = require("../../constants/console-constants");
const ProgressConstants = require("../../constants/progress-constants");
const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants");
const Configuration = require("../../components/configuration");

const SCRIPT_CODE = "uu_devkituuapptemplate_maing01-uuscriptlib/devkituuapptemplate-main/init";
const ASSET_PATH = "/public/assets/";
const PRODUCT_ICON_FILENAME = "product-icon.svg";
const COMPANY_LOGO_FILENAME = "company-logo.svg";

class InitAbl {
  constructor() {
    this.dataStore = UuAppDataStoreManager.getDataStore(DevKitUuAppTemplateMainConstants.UU_DATA_STORE);
    this.businessBrickObject = new BusinessBrickObject({
      uuAppTypeCode: DevKitUuAppTemplateMainConstants.UU_OBJECT_TYPE,
    });
  }

  async init(uri, dtoIn) {
    // HDS 1
    const awid = uri.getAwid();
    this._validateDtoIn(uri, dtoIn);

    // HDS 2
    const dao = await this.dataStore.getAwidDao(DevKitUuAppTemplateMainConstants.Schemas.DEVKITUUAPPTEMPLATE_INSTANCE);
    let uuDevKitUuAppTemplate = await dao.getByAwid(awid);
    let uuAppWorkspace = await UuAppWorkspace.get(awid);

    // HDS 3
    this._validateMode(uuDevKitUuAppTemplate, dtoIn, uuAppWorkspace.sysState);

    // HDS 4
    const configuration = await Configuration.getUuSubAppConfiguration({
      awid,
      artifactId: dtoIn.data?.locationId || uuDevKitUuAppTemplate.temporaryData?.dtoIn?.locationId,
      uuTerritoryBaseUri:
        dtoIn.data?.uuTerritoryBaseUri || uuDevKitUuAppTemplate.temporaryData?.dtoIn?.uuTerritoryBaseUri,
    });

    // HDS 5
    let initData;
    switch (dtoIn.mode) {
      case DevKitUuAppTemplateMainConstants.ModeMap.STANDARD: {
        initData = dtoIn.data;
        const uuTerritoryBaseUri = this._parseTerritoryUri(initData.uuTerritoryBaseUri);
        const temporaryData = {
          useCase: uri.getUseCase(),
          dtoIn: { ...initData },
          stepList: [DevKitUuAppTemplateMainConstants.InitStepMap.DEVKITUUAPPTEMPLATE_OBJECT_CREATED.code],
          progressMap: {
            uuConsoleUri: configuration.uuConsoleBaseUri,
            progressCode: DevKitUuAppTemplateMainConstants.getInitProgressCode(awid),
            consoleCode: DevKitUuAppTemplateMainConstants.getMainConsoleCode(awid),
          },
        };

        uuDevKitUuAppTemplate = await this.businessBrickObject.create({
          uuObject: {
            awid,
            state: DevKitUuAppTemplateMainConstants.StateMap.CREATED,
            code: `${DevKitUuAppTemplateMainConstants.AWSC_PREFIX}/${awid}`,
            uuTerritoryBaseUri: uuTerritoryBaseUri.toString(),
            name: initData.name,
            desc: initData.desc,
            temporaryData,
          },
        });

        try {
          await UuAppWorkspace.setBeingInitializedSysState(awid);
        } catch (e) {
          throw new Errors.Init.SetBeingInitializedSysStateFailed({}, e);
        }
        break;
      }

      case DevKitUuAppTemplateMainConstants.ModeMap.RETRY: {
        initData = uuDevKitUuAppTemplate.temporaryData.dtoIn;
        break;
      }

      case DevKitUuAppTemplateMainConstants.ModeMap.ROLLBACK: {
        uuDevKitUuAppTemplate.temporaryData.rollbackMode = true;
        if (!uuDevKitUuAppTemplate.temporaryData.rollbackStepList) {
          uuDevKitUuAppTemplate.temporaryData.rollbackStepList = [];
        }
        uuDevKitUuAppTemplate = await this.businessBrickObject.update({
          uuObject: { ...uuDevKitUuAppTemplate },
          versionCreationStrategy: "updateCurrentVersion",
        });
        initData = uuDevKitUuAppTemplate.temporaryData.dtoIn;
        break;
      }

      default: {
        throw new Errors.Init.WrongModeAndCircumstances({
          mode: dtoIn.mode,
          appObjectState: uuDevKitUuAppTemplate?.state,
          temporaryData: uuDevKitUuAppTemplate?.temporaryData,
        });
      }
    }

    // HDS 6
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const lockSecret = Crypto.randomBytes(32).toString("hex");
    const progressClient = await this._createInitProgress(
      uuDevKitUuAppTemplate,
      dtoIn,
      configuration,
      lockSecret,
      sysIdentitySession,
    );

    // HDS 7
    switch (dtoIn.mode) {
      case DevKitUuAppTemplateMainConstants.ModeMap.STANDARD:
      case DevKitUuAppTemplateMainConstants.ModeMap.RETRY: {
        const stepHandler = new StepHandler({
          businessBrickObject: this.businessBrickObject,
          progressClient,
          stepList: uuDevKitUuAppTemplate?.temporaryData?.stepList,
        });

        const devKitUuAppTemplateMainClient = new DevKitUuAppTemplateMainClient(
          uuDevKitUuAppTemplate,
          uuDevKitUuAppTemplate.uuTerritoryBaseUri,
        );

        uuDevKitUuAppTemplate = await stepHandler.handleStep(
          uuDevKitUuAppTemplate,
          DevKitUuAppTemplateMainConstants.InitStepMap.AWSC_CREATED,
          async () => {
            uuDevKitUuAppTemplate.state = DevKitUuAppTemplateMainConstants.StateMap.BEING_INITIALIZED;
            await this.businessBrickObject.update({
              uuObject: { ...uuDevKitUuAppTemplate },
              versionCreationStrategy: "updateCurrentVersion",
            });
            await devKitUuAppTemplateMainClient.createAwsc(
              initData.locationId,
              initData.responsibleRoleId,
              initData.permissionMatrix,
              configuration.uuAppMetaModelVersion,
            );
          },
        );

        uuDevKitUuAppTemplate = await stepHandler.handleStep(
          uuDevKitUuAppTemplate,
          DevKitUuAppTemplateMainConstants.InitStepMap.AUTHORIZATION_STRATEGY_SET,
          async () => {
            await this._setAwscAuthorizationStrategy(
              uuDevKitUuAppTemplate,
              uri.getBaseUri(),
              uuDevKitUuAppTemplate.uuTerritoryBaseUri,
              sysIdentitySession,
            );
          },
        );

        uuDevKitUuAppTemplate = await stepHandler.handleStep(
          uuDevKitUuAppTemplate,
          DevKitUuAppTemplateMainConstants.InitStepMap.CONSOLE_CREATED,
          async () => {
            await this._createConsole(uuDevKitUuAppTemplate, configuration, sysIdentitySession);
          },
        );

        // HDS 7.1 integrateBusinessBrick
        uuDevKitUuAppTemplate = await stepHandler.handleStep(
          uuDevKitUuAppTemplate,
          DevKitUuAppTemplateMainConstants.InitStepMap.BB_INTEGRATED,
          async () => {
            const args = {
              uuBusinessBrick: uuDevKitUuAppTemplate,
              uuType: DevKitUuAppTemplateMainConstants.UUAPP_CODE,
              uuAppTypeCode: DevKitUuAppTemplateMainConstants.UU_OBJECT_TYPE,
              integrationOptions: {
                createEbcCollections: true,
                createEccDocument: true,
                createEscCollection: true,
              },
              uri,
              session: sysIdentitySession,
            };
            uuDevKitUuAppTemplate = await BusinessBrickIntegrator.integrateBusinessBrick(args);
            uuDevKitUuAppTemplate = await this.businessBrickObject.update({
              uuObject: uuDevKitUuAppTemplate,
            });
          },
        );

        // TODO If your application requires any additional steps, add them here...

        if (
          !uuDevKitUuAppTemplate.temporaryData.stepList.includes(
            DevKitUuAppTemplateMainConstants.InitStepMap.PROGRESS_ENDED.code,
          )
        ) {
          await this._runScript(uri.getBaseUri(), configuration, lockSecret, sysIdentitySession);
        } else {
          await this._initFinalize(uri, { lockSecret });
        }
        break;
      }

      case DevKitUuAppTemplateMainConstants.ModeMap.ROLLBACK: {
        if (
          uuDevKitUuAppTemplate.temporaryData.stepList.includes(
            DevKitUuAppTemplateMainConstants.InitStepMap.CONSOLE_CREATED.code,
          ) &&
          !uuDevKitUuAppTemplate.temporaryData.rollbackStepList.includes(
            DevKitUuAppTemplateMainConstants.InitRollbackStepMap.CONSOLE_CLEARED.code,
          )
        ) {
          await InitRollbackAbl.initRollback(uri.getBaseUri(), configuration, lockSecret);
        } else {
          await InitRollbackAbl._initFinalizeRollback(uri, { ...dtoIn, data: { lockSecret } });
        }
        break;
      }

      default: {
        throw new Errors.Init.WrongModeAndCircumstances({
          mode: dtoIn.mode,
          appObjectState: uuDevKitUuAppTemplate?.state,
          temporaryData: uuDevKitUuAppTemplate?.temporaryData,
        });
      }
    }

    // HDS 8
    return DtoBuilder.prepareDtoOut({ data: uuDevKitUuAppTemplate });
  }

  async _initFinalize(uri, dtoIn) {
    // HDS 1
    const awid = uri.getAwid();
    Validator.validateDtoInCustom(uri, dtoIn, "sysUuAppWorkspaceInitFinalizeDtoInType");

    // HDS 2
    const dao = await this.dataStore.getAwidDao(DevKitUuAppTemplateMainConstants.Schemas.DEVKITUUAPPTEMPLATE_INSTANCE);
    let uuDevKitUuAppTemplate = await dao.getByAwid(awid);

    if (!uuDevKitUuAppTemplate) {
      // 2.1
      throw new Errors._initFinalize.UuDevKitUuAppTemplateDoesNotExist({ awid });
    }

    if (
      ![
        DevKitUuAppTemplateMainConstants.StateMap.BEING_INITIALIZED,
        DevKitUuAppTemplateMainConstants.StateMap.ACTIVE,
      ].includes(uuDevKitUuAppTemplate.state)
    ) {
      // 2.2
      throw new Errors._initFinalize.NotInProperState({
        state: uuDevKitUuAppTemplate.state,
        expectedStateList: [
          DevKitUuAppTemplateMainConstants.StateMap.BEING_INITIALIZED,
          DevKitUuAppTemplateMainConstants.StateMap.ACTIVE,
        ],
      });
    }

    // HDS 3
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const progress = {
      code: DevKitUuAppTemplateMainConstants.getInitProgressCode(uuDevKitUuAppTemplate.awid),
      lockSecret: dtoIn.lockSecret,
    };
    let progressClient = null;
    if (
      !uuDevKitUuAppTemplate.temporaryData.stepList.includes(
        DevKitUuAppTemplateMainConstants.InitStepMap.PROGRESS_ENDED.code,
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
      DevKitUuAppTemplateMainConstants.InitStepMap.PROGRESS_ENDED,
      async () => {
        await progressClient.end({
          state: ProgressConstants.StateMap.COMPLETED,
          message: "Initialization finished.",
          doneWork: DevKitUuAppTemplateMainConstants.getInitStepCount(),
        });
      },
      false,
    );

    // HDS 5
    if (uuDevKitUuAppTemplate.state === DevKitUuAppTemplateMainConstants.StateMap.BEING_INITIALIZED) {
      uuDevKitUuAppTemplate = await this.businessBrickObject.update({
        uuObject: {
          awid,
          oid: uuDevKitUuAppTemplate.oid,
          state: DevKitUuAppTemplateMainConstants.StateMap.ACTIVE,
          temporaryData: null,
        },
        versionCreationStrategy: "updateCurrentVersion",
      });
    }

    // HDS 6
    await UuAppWorkspace.setActiveSysState(awid);

    // TEMP - it is not possible to fill all sections of business brick during creation
    // fill in default value of uuDevKitUuAppTemplate page content
    // const appClient = new AppClient({ baseUri: uri.getBaseUri(), session: sysIdentitySession });
    // get document
    // const document = await appClient.cmdGet("uuDevKitUuAppTemplate/ecc/document/load", {
    //   oid: uuDevKitUuAppTemplate.oid,
    //   uuEccData: { documentOid: uuDevKitUuAppTemplate.uuEccData.documentOid },
    // });

    // TEMP - temporarily removed setting of top, till we solve problem with circular dependency
    // set top section
    // await appClient.cmdPost("uuDevKitUuAppTemplate/ecc/page/setTopSectionData", {
    //   oid: uuDevKitUuAppTemplate.oid,
    //   uuEccData: {
    //     pageOid: uuDevKitUuAppTemplate.uuEccData.pageOid,
    //     content: "<uu5string/><UuArtifactCore.PageTopSection/>",
    //   },
    // });

    // HDS 7
    this._setProductInfo(uri, uuDevKitUuAppTemplate);

    // HDS 8
    return DtoBuilder.prepareDtoOut({ data: uuDevKitUuAppTemplate });
  }

  async _setProductInfo(uri, dtoIn) {
    const productIconUri = await this._getAssetUri(uri.getBaseUri(), PRODUCT_ICON_FILENAME);
    const companyLogoUri = await this._getAssetUri(uri.getBaseUri(), COMPANY_LOGO_FILENAME);
    const awid = uri.getAwid();

    const productInfoSetDtoIn = {
      name: {
        en: dtoIn.name ?? "uuDevKitUuAppTemplate",
      },
      desc: {
        en: dtoIn.desc ?? "Default description of uuDevKitUuAppTemplate",
      },
      logo: {
        name: {
          en: "uuDevKitUuAppTemplate",
        },
        generation: 1,
        colorSchema: "blue",
        decoration: productIconUri ?? undefined,
      },
    };

    try {
      await ProductInfo.set(awid, productInfoSetDtoIn);
    } catch (e) {
      this.logger.warn(`Failed to set product info.`, e);
    }

    const productSetLogoDtoIn = {
      title: {
        en: dtoIn.name ?? "uuDevKitUuAppTemplate",
      },
      textBackground: "dark",
      imagePlacement: "upFront",
      primaryColor: "#083da8",
      imageUri: productIconUri,
      spec: {},
      companyLogoUri: companyLogoUri,
      generation: 1,
      typeMap: {
        social: {
          displaySpec: false,
        },
        logo: {
          displaySpec: false,
        },
        hero: {
          displaySpec: false,
        },
      },
      background: {
        from: "#083da8",
        to: "#0094dd",
        direction: "bottomRight",
      },
    };

    try {
      await ProductInfo.setLogo(awid, productSetLogoDtoIn);
    } catch (e) {
      this.logger.warn(`Failed to set new logo format.`, e);
    }
  }

  async _getAssetUri(uri, assetFilemane) {
    const root = Config.get("server_root") || process.cwd();
    const location = Path.join(root, ASSET_PATH, assetFilemane);

    try {
      await Fs.stat(location);
    } catch (e) {
      this.logger.warn(`Failed to read the ${assetFilemane} asset. The expected asset path: ${location}`, e);
      return null;
    }

    const asid = Config.get("asid");
    return UriBuilder.parse(uri)
      .setAwid(asid)
      .setUseCase(ASSET_PATH + assetFilemane)
      .toString();
  }

  // Validates dtoIn. In case of standard mode the data key of dtoIn is also validated.
  _validateDtoIn(uri, dtoIn) {
    let uuAppErrorMap = Validator.validateDtoIn(uri, dtoIn);
    if (dtoIn.mode === DevKitUuAppTemplateMainConstants.ModeMap.STANDARD) {
      Validator.validateDtoInCustom(uri, dtoIn.data, "sysUuAppWorkspaceInitStandardDtoInType", uuAppErrorMap);
    }
    return uuAppErrorMap;
  }

  _validateMode(uuDevKitUuAppTemplate, dtoIn, sysState) {
    switch (dtoIn.mode) {
      case DevKitUuAppTemplateMainConstants.ModeMap.STANDARD:
        if (![UuAppWorkspace.SYS_STATES.ASSIGNED, UuAppWorkspace.SYS_STATES.BEING_INITIALIZED].includes(sysState)) {
          // 3.A.1.1.
          throw new Errors.Init.SysUuAppWorkspaceIsNotInProperState({
            sysState,
            expectedSysStateList: [UuAppWorkspace.SYS_STATES.ASSIGNED, UuAppWorkspace.SYS_STATES.BEING_INITIALIZED],
          });
        }
        if (uuDevKitUuAppTemplate) {
          // 3.A.2.1.
          throw new Errors.Init.UuDevKitUuAppTemplateObjectAlreadyExist({
            mode: dtoIn.mode,
            allowedModeList: [
              DevKitUuAppTemplateMainConstants.ModeMap.RETRY,
              DevKitUuAppTemplateMainConstants.ModeMap.ROLLBACK,
            ],
          });
        }
        break;

      case DevKitUuAppTemplateMainConstants.ModeMap.RETRY:
        if (sysState !== UuAppWorkspace.SYS_STATES.BEING_INITIALIZED) {
          // 3.B.1.1.
          throw new Errors.Init.SysUuAppWorkspaceIsNotInProperState({
            sysState,
            expectedSysStateList: [UuAppWorkspace.SYS_STATES.BEING_INITIALIZED],
          });
        }
        if (!uuDevKitUuAppTemplate?.temporaryData) {
          // 3.B.2.1.
          throw new Errors.Init.MissingRequiredData();
        }
        if (uuDevKitUuAppTemplate?.temporaryData?.rollbackMode) {
          // 3.B.3.1.
          throw new Errors.Init.RollbackNotFinished();
        }
        break;

      case DevKitUuAppTemplateMainConstants.ModeMap.ROLLBACK:
        if (sysState !== UuAppWorkspace.SYS_STATES.BEING_INITIALIZED) {
          // 3.C.1.1.
          throw new Errors.Init.SysUuAppWorkspaceIsNotInProperState({
            sysState,
            expectedSysStateList: [UuAppWorkspace.SYS_STATES.BEING_INITIALIZED],
          });
        }
        if (!uuDevKitUuAppTemplate?.temporaryData) {
          // 3.C.2.1.
          throw new Errors.Init.MissingRequiredData();
        }
        if (!dtoIn.force && uuDevKitUuAppTemplate?.temporaryData?.rollbackMode) {
          // 3.C.3.1.
          throw new Errors.Init.RollbackAlreadyRunning();
        }
        break;
    }
  }

  _parseTerritoryUri(locationUri) {
    let uuTerritoryUri;

    try {
      uuTerritoryUri = UriBuilder.parse(locationUri).toUri();
    } catch (e) {
      throw new Errors.Init.UuTLocationUriParseFailed({ uri: locationUri }, e);
    }

    return uuTerritoryUri.getBaseUri();
  }

  async _createInitProgress(uuDevKitUuAppTemplate, dtoIn, config, lockSecret, session) {
    let progressClient;
    let progress = {
      expireAt: UuDateTime.now().shift("day", 7),
      name: DevKitUuAppTemplateMainConstants.getInitProgressName(uuDevKitUuAppTemplate.awid),
      code: DevKitUuAppTemplateMainConstants.getInitProgressCode(uuDevKitUuAppTemplate.awid),
      authorizationStrategy: "uuIdentityList",
      permissionMap: await this._getInitProgressPermissionMap(uuDevKitUuAppTemplate.awid, session),
      lockSecret,
    };

    try {
      progressClient = await ProgressClient.get(config.uuConsoleBaseUri, { code: progress.code }, { session });
    } catch (e) {
      if (e.cause?.code !== ProgressConstants.PROGRESS_DOES_NOT_EXIST) {
        throw new Errors.Init.ProgressGetCallFailed({ progressCode: progress.code }, e);
      }
    }

    if (!progressClient) {
      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.Init.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    } else if (dtoIn.force) {
      try {
        await progressClient.releaseLock();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_RELEASE_DOES_NOT_EXIST) {
          throw new Errors.Init.ProgressReleaseLockCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        await progressClient.setState({ state: "cancelled" });
      } catch (e) {
        DtoBuilder.addWarning(new Warnings.Init.ProgressSetStateCallFailed(e.cause?.paramMap));
      }

      try {
        await progressClient.delete();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_DELETE_DOES_NOT_EXIST) {
          throw new Errors.Init.ProgressDeleteCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.Init.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    }

    try {
      await progressClient.start({
        message: "Progress was started",
        totalWork:
          dtoIn.mode === DevKitUuAppTemplateMainConstants.ModeMap.ROLLBACK
            ? DevKitUuAppTemplateMainConstants.getInitRollbackStepCount()
            : DevKitUuAppTemplateMainConstants.getInitStepCount(),
        lockSecret,
      });
    } catch (e) {
      throw new Errors.Init.ProgressStartCallFailed({ progressCode: progress.code }, e);
    }

    return progressClient;
  }

  async _getInitProgressPermissionMap(awid, sysIdentitySession) {
    const awidData = await UuAppWorkspace.get(awid);

    let permissionMap = {};
    for (let identity of awidData.awidInitiatorList) {
      permissionMap[identity] = DevKitUuAppTemplateMainConstants.CONSOLE_BOUND_MATRIX.Authorities;
    }
    permissionMap[sysIdentitySession.getIdentity().getUuIdentity()] =
      DevKitUuAppTemplateMainConstants.CONSOLE_BOUND_MATRIX.Authorities;

    return permissionMap;
  }

  async _setAwscAuthorizationStrategy(uuDevKitUuAppTemplate, appUri, uuTerritoryBaseUri, session) {
    try {
      await UuAppWorkspace.setAuthorizationStrategy(
        appUri,
        {
          uuTerritoryBaseUri,
          authorizationStrategy: DevKitUuAppTemplateMainConstants.AWSC_AUTHORIZATION_STRATEGY,
          artifactId: uuDevKitUuAppTemplate.artifactId,
          artifactCode: `${DevKitUuAppTemplateMainConstants.AWSC_PREFIX}/${uuDevKitUuAppTemplate.awid}`,
        },
        session,
      );
    } catch (e) {
      throw new Errors.DevKitUuAppTemplateMain.SetAwscAuthorizationStrategyFailed(
        {
          awid: uuDevKitUuAppTemplate.awid,
          awscId: uuDevKitUuAppTemplate.artifactId,
          uuTerritoryBaseUri,
        },
        e,
      );
    }
  }

  async _createConsole(uuDevKitUuAppTemplate, configuration, session) {
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

  async _setConsoleExpiration(uuConsoleUri, consoleCode, session) {
    let consoleClient;
    try {
      consoleClient = await ConsoleClient.get(uuConsoleUri, { code: consoleCode }, { session });
    } catch (e) {
      if (e.cause?.code === ConsoleConstants.CONSOLE_GET_DOES_NOT_EXISTS) {
        throw new Errors._initFinalize.ConsoleGetCallFailed({ code: consoleCode }, e);
      }
    }

    try {
      await consoleClient.update({ expireAt: new UuDateTime().shift("day", 7).date });
    } catch (e) {
      if (e.cause?.code === ConsoleConstants.CONSOLE_UPDATE_DOES_NOT_EXISTS) {
        DtoBuilder.addWarning(new Warnings._initFinalize.ConsoleDoesNotExist({ code: consoleCode }));
      } else {
        throw new Errors._initFinalize.ConsoleUpdateCallFailed({ code: consoleCode }, e);
      }
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

module.exports = new InitAbl();
