"use strict";
const { UseCaseContext } = require("uu_appg01_server").AppServer;
const Constants = require("../constants/devkituuapptemplate-main-constants");

class DtoBuilder {
  addWarning(warning) {
    const uuAppErrorMap = UseCaseContext.getAttribute(Constants.UU_APP_ERROR_MAP);
    uuAppErrorMap[warning.code] = {
      type: "warning",
      message: warning.message,
      paramMap: warning.paramMap,
    };
    return uuAppErrorMap;
  }

  addUuAppErrorMap(addedUuAppErrorMap) {
    const uuAppErrorMap = UseCaseContext.getAttribute(Constants.UU_APP_ERROR_MAP);
    for (let key of Object.keys(addedUuAppErrorMap)) {
      uuAppErrorMap[key] = addedUuAppErrorMap[key];
    }
    return uuAppErrorMap;
  }

  prepareDtoOut(dtoOut = {}) {
    const uuAppErrorMap = UseCaseContext.getAttribute(Constants.UU_APP_ERROR_MAP);
    return { ...dtoOut, uuAppErrorMap };
  }
}

module.exports = new DtoBuilder();