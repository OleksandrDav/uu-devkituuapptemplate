"use strict";

const DevKitUuAppTemplateMainUseCaseError = require("./devkituuapptemplate-main-use-case-error.js");
const HISTORIZABLE_OBJECT_ERROR_PREFIX = `${DevKitUuAppTemplateMainUseCaseError.ERROR_PREFIX}historizableObject/`;

const Create = {
  UC_CODE: `${HISTORIZABLE_OBJECT_ERROR_PREFIX}create/`,
};

const _CreateFinalize = {
  UC_CODE: `${HISTORIZABLE_OBJECT_ERROR_PREFIX}_createFinalize/`,

  InvalidDtoIn: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor() {
      super(...arguments);
      this.code = `${_CreateFinalize.UC_CODE}invalidDtoIn`;
      this.message = "DtoIn is not valid.";
    }
  },

  ControlObjectDoesNotExist: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor() {
      super(...arguments);
      this.code = `${_CreateFinalize.UC_CODE}controlObjectDoesNotExist`;
      this.message = "Control object does not exist.";
    }
  },

  ControlObjectIsNotInProperState: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor() {
      super(...arguments);
      this.code = `${_CreateFinalize.UC_CODE}controlObjectIsNotInProperState`;
      this.message = "Control object is not in proper state.";
    }
  },
};

const _CreateFinalizeRollback = {
  UC_CODE: `${HISTORIZABLE_OBJECT_ERROR_PREFIX}_createFinalizeRollback/`,

  InvalidDtoIn: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor() {
      super(...arguments);
      this.code = `${_CreateFinalizeRollback.UC_CODE}invalidDtoIn`;
      this.message = "DtoIn is not valid.";
    }
  },

  ControlObjectDoesNotExist: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor() {
      super(...arguments);
      this.code = `${_CreateFinalizeRollback.UC_CODE}controlObjectDoesNotExist`;
      this.message = "Control object does not exist.";
    }
  },

  ControlObjectIsNotInProperState: class extends DevKitUuAppTemplateMainUseCaseError {
    constructor() {
      super(...arguments);
      this.code = `${_CreateFinalizeRollback.UC_CODE}controlObjectIsNotInProperState`;
      this.message = "Control object is not in proper state.";
    }
  },
};

const Update = {
  UC_CODE: `${HISTORIZABLE_OBJECT_ERROR_PREFIX}update/`,
};

const List = {
  UC_CODE: `${HISTORIZABLE_OBJECT_ERROR_PREFIX}list/`,
};

const Get = {
  UC_CODE: `${HISTORIZABLE_OBJECT_ERROR_PREFIX}get/`,
};

const SetState = {
  UC_CODE: `${HISTORIZABLE_OBJECT_ERROR_PREFIX}setState/`,
};

const SetFinalState = {
  UC_CODE: `${HISTORIZABLE_OBJECT_ERROR_PREFIX}setFinalState/`,
};

const Load = {
  UC_CODE: `${HISTORIZABLE_OBJECT_ERROR_PREFIX}load/`,
};

module.exports = {
  Load,
  SetFinalState,
  SetState,
  Get,
  List,
  Update,
  Create,
  _CreateFinalize,
  _CreateFinalizeRollback,
};
