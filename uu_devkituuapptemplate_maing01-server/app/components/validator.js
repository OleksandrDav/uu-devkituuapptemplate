"use strict";
const { InvalidDtoIn } = require("../api/errors/common-error");
const { Validator: AppServerValidator } = require("uu_appg01_server").Validation;
const { ValidationHelper, UseCaseContext } = require("uu_appg01_server").AppServer;
const DevKitUuAppTemplateMainConstants = require("../constants/devkituuapptemplate-main-constants");

const WARNING_CODE = "unsupportedKeys";
const VALIDATION_DTO_IN_TYPE_POSTFIX = "DtoInType";

class Validator {
  constructor() {
    this.validator = AppServerValidator.load();
  }

  validateDtoIn(uri, dtoIn, uuAppErrorMap) {
    return this.validateDtoInCustom(
      uri,
      dtoIn,
      this._getValidationTypeCode(uri, VALIDATION_DTO_IN_TYPE_POSTFIX),
      uuAppErrorMap,
    );
  }

  validateDtoInCustom(uri, dtoIn, validationType, uuAppErrorMap) {
    return this.validateCustom(uri, dtoIn, validationType, InvalidDtoIn, uuAppErrorMap);
  }

  validateCustom(uri, dtoIn, validationType, error, uuAppErrorMap) {
    uuAppErrorMap ??= UseCaseContext.getAttribute(DevKitUuAppTemplateMainConstants.UU_APP_ERROR_MAP);
    let validationResult = this.validator.validate(validationType, dtoIn);
    return ValidationHelper.processValidationResult(dtoIn, validationResult, uuAppErrorMap, this._getCode(uri), error);
  }

  _getValidationTypeCode(uri, type) {
    let useCase = uri.getUseCase().replace(/_/g, "");
    return (
      useCase.split("/").reduce((type, part, i) => (i === 0 ? type + part : type + this._capitalize(part)), "") + type
    );
  }

  _capitalize(string) {
    return `${string[0].toUpperCase()}${string.slice(1)}`;
  }

  _getCode(uri) {
    return `${DevKitUuAppTemplateMainConstants.ERROR_PREFIX}/${uri.getUseCase()}/${WARNING_CODE}`;
  }
}

module.exports = new Validator();
