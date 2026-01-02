"use strict";
const { Dao } = require("uu_businessbrickg02_lib").Common;

class DevKitUuAppTemplateAsidMongoDao extends Dao.BusinessBrickHistorizableAsidDao {
  async createSchema() {
    await super.createSchema();
  }
}

module.exports = DevKitUuAppTemplateAsidMongoDao;
