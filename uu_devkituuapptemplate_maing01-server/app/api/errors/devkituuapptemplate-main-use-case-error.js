"use strict";
const { UseCaseError, UseCaseContext } = require("uu_appg01_server").AppServer;
const DevKitUuAppTemplateMainConstants = require("../../constants/devkituuapptemplate-main-constants.js");

class DevKitUuAppTemplateMainUseCaseError extends UseCaseError {
  constructor(code, message, paramMap, cause, status = 400, dtoOut) {
    if (paramMap instanceof Error) {
      cause = paramMap;
      paramMap = {};
    }
    if (!dtoOut) {
      dtoOut = { uuAppErrorMap: UseCaseContext.getAttribute(DevKitUuAppTemplateMainConstants.UU_APP_ERROR_MAP) };
    }
    super({ dtoOut, paramMap, status }, cause);
    this.code = DevKitUuAppTemplateMainUseCaseError.generateCode(code);
    this.message = message;
  }

  /**
   * Regenerates code based on input URI.
   * This can be used in cases, when URI cannot be passed as input parameter to constructor.
   */
  static generateCode(code) {
    let uri = UseCaseContext.getUri();
    //If the URI is specified and the code does not contain any slash, generate code as <product from URI>/<useCase from URI>/code.
    return code.indexOf("/") < 0
      ? `${DevKitUuAppTemplateMainConstants.ERROR_PREFIX}/${uri.getUseCase()}/${code}`
      : code;
  }
}

module.exports = DevKitUuAppTemplateMainUseCaseError;
