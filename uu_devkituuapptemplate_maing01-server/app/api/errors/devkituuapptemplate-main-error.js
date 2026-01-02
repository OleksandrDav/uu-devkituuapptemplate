"use strict";
const DevKitUuAppTemplateMainUseCaseError = require("./devkituuapptemplate-main-use-case-error.js");

const Init = {
  UC_CODE: `${DevKitUuAppTemplateMainUseCaseError.ERROR_PREFIX}init/`,

  SysUuAppWorkspaceIsNotInProperState: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "sysUuAppWorkspaceIsNotInProperState",
        "SysUuAppWorkspace is not in proper state for init execution in chosen mode.",
        paramMap,
        cause,
      );
    }
  },

  UuDevKitUuAppTemplateObjectAlreadyExist: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "uuDevKitUuAppTemplateObjectAlreadyExist",
        "Standard mode cannot be executed if uuDevKitUuAppTemplate uuObject already exist. Choose retry or rollback mode instead.",
        paramMap,
        cause,
      );
    }
  },

  MissingRequiredData: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "missingRequiredData",
        "InitTemporaryData are missing, it is not possible to execute initialization in chosen mode.",
        paramMap,
        cause,
      );
    }
  },

  RollbackNotFinished: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "rollbackNotFinished",
        "It is not possible to retry initialization. Rollback already started and is in progress now.",
        paramMap,
        cause,
      );
    }
  },

  RollbackAlreadyRunning: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("rollbackAlreadyRunning", "Rollback is already running.", paramMap, cause);
    }
  },

  UuTLocationUriParseFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuTLocationUriParseFailed", "Parsing of uuTerritory location failed.", paramMap, cause);
    }
  },

  WrongModeAndCircumstances: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "wrongModeAndCircumstances",
        "Not possible to execute the cmd under current circumstances.",
        paramMap,
        cause,
      );
    }
  },

  SetBeingInitializedSysStateFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("setBeingInitializedSysStateFailed", "Failed to set beingInitialized sysState.", paramMap, cause);
    }
  },

  ProgressCreateCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressCreateCallFailed", "Failed to call progress/create uuCommand.", paramMap, cause);
    }
  },

  ProgressReleaseLockCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressReleaseLockCallFailed", "Failed to call progress/releaseLock uuCommand.", paramMap, cause);
    }
  },

  ProgressGetCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressGetCallFailed", "Failed to call progress/get uuCommand.", paramMap, cause);
    }
  },

  ProgressStartCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressStartCallFailed", "Failed to call progress/start uuCommand.", paramMap, cause);
    }
  },

  ProgressEndCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressEndCallFailed", "Failed to call progress/end uuCommand.", paramMap, cause);
    }
  },

  ProgressDeleteCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressDeleteCallFailed", "Failed to call progress/delete uuCommand.", paramMap, cause);
    }
  },

  FailedToCreateConsole: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("failedToCreateConsole", "Create console failed.", paramMap, cause);
    }
  },
};

const _initFinalize = {
  UC_CODE: `${DevKitUuAppTemplateMainUseCaseError.ERROR_PREFIX}_initFinalize/`,

  UuDevKitUuAppTemplateDoesNotExist: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateDoesNotExist", "uuDevKitUuAppTemplate does not exist", paramMap, cause);
    }
  },

  NotInProperState: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateIsNotInProperState", "uuDevKitUuAppTemplate is not in proper state", paramMap, cause);
    }
  },

  ConsoleGetCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("consoleGetCallFailed", "Failed to call console/get uuCommand.", paramMap, cause);
    }
  },

  ConsoleUpdateCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("consoleUpdateCallFailed", "Failed to call console/update uuCommand.", paramMap, cause);
    }
  },
};

const _initFinalizeRollback = {
  UC_CODE: `${DevKitUuAppTemplateMainUseCaseError.ERROR_PREFIX}_initFinalizeRollback/`,

  NotInProperState: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateIsNotInProperState", "uuDevKitUuAppTemplate is not in proper state", paramMap, cause);
    }
  },

  UuDevKitUuAppTemplateDoesNotExist: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateDoesNotExist", "uuDevKitUuAppTemplate does not exist", paramMap, cause);
    }
  },

  ConsoleGetCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("consoleGetCallFailed", "Failed to call console/get uuCommand.", paramMap, cause);
    }
  },

  ConsoleClearCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("consoleClearCallFailed", "Failed to call console/clear uuCommand.", paramMap, cause);
    }
  },

  SetAssignedSysStateFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("setAssignedSysStateFailed", "Failed to set assigned sysState.", paramMap, cause);
    }
  },

  ProgressEndCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressEndCallFailed", "Failed to call progress/end uuCommand.", paramMap, cause);
    }
  },

  ProgressSetStateCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressSetStateCallFailed", "Failed to call progress/setState uuCommand.", paramMap, cause);
    }
  },

  ProgressDeleteCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressDeleteCallFailed", "Failed to call progress/delete uuCommand.", paramMap, cause);
    }
  },
};

const Commence = {
  UC_CODE: `${DevKitUuAppTemplateMainUseCaseError.ERROR_PREFIX}commence/`,

  SchemaDaoCreateSchemaFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("schemaDaoCreateSchemaFailed", "Create schema by Dao createSchema failed.", paramMap, cause);
    }
  },
};

const SetStateClosed = {
  UC_CODE: `${DevKitUuAppTemplateMainUseCaseError.ERROR_PREFIX}setStateClosed/`,

  UuDevKitUuAppTemplateDoesNotExist: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateDoesNotExist", "uuDevKitUuAppTemplate does not exist", paramMap, cause);
    }
  },

  NotInProperState: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "uuDevKitUuAppTemplateIsNotInProperState",
        "uuDevKitUuAppTemplate is not in proper state for useCase execution.",
        paramMap,
        cause,
      );
    }
  },

  UseCaseExecutionForbidden: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "useCaseExecutionForbidden",
        "The called useCase cannot be executed, another useCase is in progress.",
        paramMap,
        cause,
      );
    }
  },

  UuTLocationUriParseFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuTLocationUriParseFailed", "Parsing of uuTerritory location failed.", paramMap, cause);
    }
  },

  ProgressCreateCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressCreateCallFailed", "Failed to call progress/create uuCommand.", paramMap, cause);
    }
  },

  ProgressReleaseLockCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressReleaseLockCallFailed", "Failed to call progress/releaseLock uuCommand.", paramMap, cause);
    }
  },

  ProgressGetCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressGetCallFailed", "Failed to call progress/get uuCommand.", paramMap, cause);
    }
  },

  ProgressStartCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressStartCallFailed", "Failed to call progress/start uuCommand.", paramMap, cause);
    }
  },

  ProgressEndCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressEndCallFailed", "Failed to call progress/end uuCommand.", paramMap, cause);
    }
  },

  ProgressDeleteCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressDeleteCallFailed", "Failed to call progress/delete uuCommand.", paramMap, cause);
    }
  },
};

const _setStateClosedFinalize = {
  UC_CODE: `${DevKitUuAppTemplateMainUseCaseError.ERROR_PREFIX}_setStateClosedFinalize/`,

  UuDevKitUuAppTemplateDoesNotExist: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateDoesNotExist", "uuDevKitUuAppTemplate does not exist", paramMap, cause);
    }
  },

  NotInProperState: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateIsNotInProperState", "uuDevKitUuAppTemplate is not in proper state", paramMap, cause);
    }
  },

  MissingRequiredData: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("missingRequiredData", "Missing required temporary data for useCase execution.", paramMap, cause);
    }
  },

  UseCaseExecutionForbidden: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "useCaseExecutionForbidden",
        "The called useCase cannot be executed, another useCase is in progress.",
        paramMap,
        cause,
      );
    }
  },
};

const Clear = {
  UC_CODE: `${DevKitUuAppTemplateMainUseCaseError.ERROR_PREFIX}clear/`,

  UuDevKitUuAppTemplateDoesNotExist: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateDoesNotExist", "uuDevKitUuAppTemplate does not exist", paramMap, cause);
    }
  },

  NotInProperState: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateIsNotInProperState", "uuDevKitUuAppTemplate is not in proper state", paramMap, cause);
    }
  },

  UseCaseExecutionForbidden: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "useCaseExecutionForbidden",
        "The called useCase cannot be executed, another useCase is in progress.",
        paramMap,
        cause,
      );
    }
  },

  SetAssignedSysStateFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("setAssignedSysStateFailed", "Failed to set assigned sysState.", paramMap, cause);
    }
  },

  UuTLocationUriParseFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuTLocationUriParseFailed", "Parsing of uuTerritory location failed.", paramMap, cause);
    }
  },

  ProgressCreateCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressCreateCallFailed", "Failed to call progress/create uuCommand.", paramMap, cause);
    }
  },

  ProgressReleaseLockCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressReleaseLockCallFailed", "Failed to call progress/releaseLock uuCommand.", paramMap, cause);
    }
  },

  ProgressGetCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressGetCallFailed", "Failed to call progress/get uuCommand.", paramMap, cause);
    }
  },

  ProgressStartCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressStartCallFailed", "Failed to call progress/start uuCommand.", paramMap, cause);
    }
  },

  ProgressEndCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressEndCallFailed", "Failed to call progress/end uuCommand.", paramMap, cause);
    }
  },

  ProgressDeleteCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressDeleteCallFailed", "Failed to call progress/delete uuCommand.", paramMap, cause);
    }
  },
};

const _clearFinalize = {
  UC_CODE: `${DevKitUuAppTemplateMainUseCaseError.ERROR_PREFIX}_clearFinalize/`,

  UuDevKitUuAppTemplateDoesNotExist: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateDoesNotExist", "uuDevKitUuAppTemplate does not exist", paramMap, cause);
    }
  },

  NotInProperState: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("uuDevKitUuAppTemplateIsNotInProperState", "uuDevKitUuAppTemplate is not in proper state", paramMap, cause);
    }
  },

  MissingRequiredData: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("missingRequiredData", "Missing required temporary data for useCase execution.", paramMap, cause);
    }
  },

  UseCaseExecutionForbidden: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super(
        "useCaseExecutionForbidden",
        "The called useCase cannot be executed, another useCase is in progress.",
        paramMap,
        cause,
      );
    }
  },

  ProgressGetCallFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("progressGetCallFailed", "Failed to call progress/get uuCommand.", paramMap, cause);
    }
  },

  SetAssignedSysStateFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("setAssignedSysStateFailed", "Failed to set assigned sysState.", paramMap, cause);
    }
  },
};

const DevKitUuAppTemplateMain = {
  CreateAwscFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("createAwscFailed", "Create uuAwsc failed.", paramMap, cause);
    }
  },

  SetAwscAuthorizationStrategyFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("setAwscAuthorizationStrategyFailed", "Set uuAwsc authorization strategy failed.", paramMap, cause);
    }
  },

  SetAwscStateFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("setAwscStateFailed", "Set uuAwsc state failed.", paramMap, cause);
    }
  },

  LoadAwscFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("loadAwscFailed", "Load of uuAwsc failed.", paramMap, cause);
    }
  },

  DeleteAwscFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("deleteAwscFailed", "Delete uuAwsc failed.", paramMap, cause);
    }
  },

  ArtifactIfcListActivitiesFailed: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("artifactIfcListActivitiesFailed", "Failed to list uuAwsc activities.", paramMap, cause);
    }
  },

  SomeActivitiesNotCompleted: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor(paramMap = {}, cause = null) {
      super("someActivitiesNotCompleted", "There are not completed activities on uuAwsc.", paramMap, cause);
    }
  },
};

module.exports = {
  Init,
  _initFinalize,
  _initFinalizeRollback,
  Commence,
  SetStateClosed,
  _setStateClosedFinalize,
  Clear,
  _clearFinalize,
  DevKitUuAppTemplateMain,
};
