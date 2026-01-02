"use strict";
const { Dao } = require("uu_businessbrickg02_lib").Common;

class HistorizableObjectAwidMongoDao extends Dao.BusinessBrickHistorizableAwidDao {
  /*
    FIXME: Business bricks lacks support for getByAwid in case of historizable entity
    TODO: Remove after sls will be solved: https://uuapp.plus4u.net/uu-sls-maing01/2153d855963f4d49ac0abc9b6ea3cfa1/issueDetail?id=67ee9ea3f341420022ce43f7
  */
  async getByAwid(awid) {
    return await super._findOne({ awid });
  }
}

module.exports = HistorizableObjectAwidMongoDao;
