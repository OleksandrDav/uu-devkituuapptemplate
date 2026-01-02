"use strict";

//@@viewOn:constants
const DevKitUuAppTemplateMainConstants = {
  AWSC_PREFIX: "uu-devkituuapptemplate",
  CONSOLE_PREFIX: "devKitUuAppTemplate",
  ERROR_PREFIX: "uu-devkituuapptemplate-main",
  INIT_PROGRESS_CODE_PREFIX: "uu-devkituuapptemplate-maing01-progress-init-",
  INIT_PROGRESS_NAME_PREFIX: "uuDevKitUuAppTemplate Init ",
  SET_STATE_CLOSED_PROGRESS_CODE_PREFIX: "uu-devkituuapptemplate-maing01-progress-setStateClosed-",
  SET_STATE_CLOSED_PROGRESS_NAME_PREFIX: "uuDevKitUuAppTemplate Set State Closed ",
  CLEAR_PROGRESS_CODE_PREFIX: "uu-devkituuapptemplate-maing01-progress-clear-",
  CLEAR_PROGRESS_NAME_PREFIX: "uuDevKitUuAppTemplate Clear ",
  UUAPP_CODE: "uu-devkituuapptemplate-maing01",
  UU_DATA_STORE: "devKitUuAppTemplateMainObjectStore",
  UU_OBJECT_TYPE: "uuDevKitUuAppTemplate",
  AWSC_AUTHORIZATION_STRATEGY: "artifact",

  CONFIG_CACHE_KEY: "configuration",
  UU_APP_ERROR_MAP: "uuAppErrorMap",

  // This is bound matrix of uuAwsc and uuConsole which has authorization bounded to that uuAwsc.
  CONSOLE_BOUND_MATRIX: {
    Authorities: ["Authorities", "Readers", "Writers"],
    Operatives: ["Readers", "Writers"],
    Auditors: ["Readers"],
    SystemIdentity: ["Authorities", "Readers", "Writers"],
  },

  InitStepMap: {
    DEVKITUUAPPTEMPLATE_OBJECT_CREATED: {
      code: "uuDevKitUuAppTemplateObjectCreated",
      message: "The uuObject of uuDevKitUuAppTemplate created.",
    },
    AWSC_CREATED: { code: "uuAwscCreated", message: "The uuAwsc of uuDevKitUuAppTemplate created." },
    AUTHORIZATION_STRATEGY_SET: {
      code: "authorizationStrategySet",
      message: "The uuDevKitUuAppTemplate uuAppWorkspace authorization strategy set.",
    },
    CONSOLE_CREATED: { code: "consoleCreated", message: "The console of uuDevKitUuAppTemplate created." },
    PROGRESS_ENDED: { code: "progressEnded", message: "The progress has been ended." },
    WS_ACTIVE: {
      code: "uuAppWorkspaceActiveState",
      message: "The uuAppWorkspace of uuDevKitUuAppTemplate set to active state.",
    },
    BB_INTEGRATED: {
      code: "uuBusinessBrickIntegrated",
      message: "The uuBusinessBrick of uuDevKitUuAppTemplate integrated.",
    },
  },

  InitRollbackStepMap: {
    CONSOLE_CLEARED: { code: "consoleCleared", message: "The uuDevKitUuAppTemplate console has been cleared." },
    WS_DISCONNECTED: {
      code: "uuAppWorkspaceDisconnected",
      message: "The uuDevKitUuAppTemplate uuAppWorkspace disconnected.",
    },
    AWSC_DELETED: { code: "uuAwscDeleted", message: "The uuAwsc of uuDevKitUuAppTemplate deleted." },
    PROGRESS_DELETED: { code: "progressDeleted", message: "The progress has been deleted." },
  },

  SetStateClosedStepMap: {
    CLOSE_STARTED: { code: "setStateClosedStarted", message: "SetStateClosed has started." },
    AWSC_CLOSED: { code: "uuAwscClosed", message: "The uuObject of uuDevKitUuAppTemplate set to closed state." },
    PROGRESS_ENDED: { code: "progressEnded", message: "The progress has been ended." },
  },

  ClearStepMap: {
    CLEAR_STARTED: { code: "clearStarted", message: "Clear has started." },
    INIT_PROGRESS_DELETED: { code: "initProgressDeleted", message: "The init progress has been deleted." },
    SET_STATE_CLOSED_PROGRESS_DELETED: {
      code: "setStateClosedProgressDeleted",
      message: "The setStateClosed progress has been deleted.",
    },
    CONSOLE_CLEARED: { code: "consoleCleared", message: "The uuDevKitUuAppTemplate console has been cleared." },
    AUTH_STRATEGY_UNSET: {
      code: "authorizationStrategyUnset",
      message: "The authorization strategy has been unset.",
    },
    AWSC_DELETED: { code: "uuAwscDeleted", message: "The uuAwsc of uuDevKitUuAppTemplate deleted." },
    PROGRESS_ENDED: { code: "progressEnded", message: "The progress has been ended." },
  },

  ModeMap: {
    STANDARD: "standard",
    RETRY: "retry",
    ROLLBACK: "rollback",
  },

  ProfileMask: {
    STANDARD_USER: parseInt("00010000000000000000000000000000", 2),
  },

  PropertyMap: {
    CONFIG: "config",
    SCRIPT_CONFIG: "scriptConfig",
    DEVKITUUAPPTEMPLATE_CONFIG: "uuDevKitUuAppTemplateConfig",
  },

  Schemas: {
    DEVKITUUAPPTEMPLATE_INSTANCE: "uuDevKitUuAppTemplate",
  },

  SharedResources: {
    SCRIPT_CONSOLE: "uu-console-maing02",
    SCRIPT_ENGINE: "uu-script-engineg02",
  },

  StateMap: {
    CREATED: "created",
    BEING_INITIALIZED: "beingInitialized",
    ACTIVE: "active",
    FINAL: "closed",
  },

  getMainConsoleCode: (awid) => {
    return `uu-devkituuapptemplate-maing01-console-${awid}`;
  },

  getInitProgressCode: (awid) => {
    return `${DevKitUuAppTemplateMainConstants.INIT_PROGRESS_CODE_PREFIX}${awid}`;
  },

  getInitProgressName: (awid) => {
    return `${DevKitUuAppTemplateMainConstants.INIT_PROGRESS_NAME_PREFIX}${awid}`;
  },

  getSetStateClosedProgressName: (awid) => {
    return `${DevKitUuAppTemplateMainConstants.SET_STATE_CLOSED_PROGRESS_NAME_PREFIX}${awid}`;
  },

  getSetStateClosedProgressCode: (awid) => {
    return `${DevKitUuAppTemplateMainConstants.SET_STATE_CLOSED_PROGRESS_CODE_PREFIX}${awid}`;
  },

  getClearProgressName: (awid) => {
    return `${DevKitUuAppTemplateMainConstants.CLEAR_PROGRESS_NAME_PREFIX}${awid}`;
  },

  getClearProgressCode: (awid) => {
    return `${DevKitUuAppTemplateMainConstants.CLEAR_PROGRESS_CODE_PREFIX}${awid}`;
  },

  getInitStepCount: () => {
    return Object.keys(DevKitUuAppTemplateMainConstants.InitStepMap).length;
  },

  getInitRollbackStepCount: () => {
    return Object.keys(DevKitUuAppTemplateMainConstants.InitRollbackStepMap).length;
  },

  getSetStateClosedStepCount: () => {
    return Object.keys(DevKitUuAppTemplateMainConstants.SetStateClosedStepMap).length;
  },

  getClearStepCount: () => {
    return Object.keys(DevKitUuAppTemplateMainConstants.ClearStepMap).length;
  },
};
//@@viewOff:constants

//@@viewOn:exports
module.exports = DevKitUuAppTemplateMainConstants;
//@@viewOff:exports
