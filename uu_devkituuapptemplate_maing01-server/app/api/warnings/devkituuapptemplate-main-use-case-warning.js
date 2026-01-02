"use strict";
const DevKitUuAppTemplateMainUseCaseError = require("../errors/devkituuapptemplate-main-use-case-error.js");

class DevKitUuAppTemplateMainUseCaseWarning {
  constructor(code, message, paramMap) {
    this.code = DevKitUuAppTemplateMainUseCaseError.generateCode(code);
    this.message = message;
    this.paramMap = paramMap instanceof Error ? undefined : paramMap;
  }
}

module.exports = DevKitUuAppTemplateMainUseCaseWarning;
