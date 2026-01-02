"use strict";
const DevKitUuAppTemplateMainUseCaseError = require("./devkituuapptemplate-main-use-case-error.js");

class CallScriptEngineFailed extends DevKitUuAppTemplateMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("callScriptEngineFailed", "Call scriptEngine failed.", paramMap, cause);
  }
}

module.exports = {
  CallScriptEngineFailed,
};
