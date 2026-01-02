"use strict";
const { UuAppDataStoreManager } = require("uu_app_datastoreg02");
const { Dao } = require("uu_businessbrickg02_lib").Common;

class DevKitUuAppTemplateAwidMongoDao extends Dao.BusinessBrickHistorizableAwidDao {
  /*
    FIXME: Business bricks lacks support for getByAwid in case of historizable entity
    TODO: Remove after sls will be solved: https://uuapp.plus4u.net/uu-sls-maing01/2153d855963f4d49ac0abc9b6ea3cfa1/issueDetail?id=67ee9ea3f341420022ce43f7
  */
  async getByAwid(awid) {
    return await super._findOne({ awid });
  }

  // TODO:Temporary solution. Currently there is no support from the appserver to remove auth data from uuAppWorkspace.
  async cleanWorkspaceAuthStrategy(awid, awidInitiatorList) {
    const objectStore = UuAppDataStoreManager.getDataStore("devKitUuAppTemplateMainObjectStore");
    const collection = await objectStore.getDbCollection("sysUuAppWorkspace");

    let data = { authorizationStrategy: "roleGroupInterface", authorizationData: null };
    if (awidInitiatorList) data.awidInitiatorList = awidInitiatorList;
    return await collection.updateMany({ awid }, { $set: data });
  }
}

module.exports = DevKitUuAppTemplateAwidMongoDao;
