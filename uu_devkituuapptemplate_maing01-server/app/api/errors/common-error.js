"use strict";
const DevKitUuAppTemplateMainUseCaseError = require("./devkituuapptemplate-main-use-case-error.js");

class InvalidDtoIn extends DevKitUuAppTemplateMainUseCaseError {
  constructor(dtoOut, paramMap = {}, cause = null) {
    super("invalidDtoIn", "DtoIn is not valid.", paramMap, cause, undefined, dtoOut);
  }
}

module.exports = {
  InvalidDtoIn,
};
