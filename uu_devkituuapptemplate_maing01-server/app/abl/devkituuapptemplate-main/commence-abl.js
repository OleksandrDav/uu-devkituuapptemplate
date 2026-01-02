"use strict";
const { UuAppObjectStore } = require("uu_app_objectstoreg02");
const { UuAppDataStoreManager } = require("uu_app_datastoreg02");
const { BusinessBrickIntegrator } = require("uu_businessbrickg02_lib").Common.Components;

const Errors = require("../../api/errors/devkituuapptemplate-main-error");
const DtoBuilder = require("../../components/dto-builder");
const Validator = require("../../components/validator");

class CommenceAbl {
  async commence(uri, dtoIn, session, uuAppErrorMap = {}) {
    // HDS 1
    Validator.validateDtoIn(uri, dtoIn);

    // TODO If your application requires any additional steps, add them here...

    // HDS 2
    const promises = [];
    for await (const dataStore of await UuAppDataStoreManager.getDataStoreList()) {
      if ((!dataStore) instanceof UuAppObjectStore) continue;

      const asidDaoList = await dataStore.getAsidDaoList();
      for await (const asidDao of asidDaoList) {
        promises.push(asidDao.createSchema());
      }
    }
    try {
      await Promise.all(promises);
    } catch (e) {
      throw new Errors.Commence.SchemaDaoCreateSchemaFailed({}, e);
    }

    // HDS 3
    await BusinessBrickIntegrator.initializeBbSchemas(uri, session, uuAppErrorMap);

    // HDS 4
    return DtoBuilder.prepareDtoOut();
  }
}

module.exports = new CommenceAbl();