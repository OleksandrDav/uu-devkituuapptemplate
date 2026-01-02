"use strict";
const CreateAbl = require("../../abl/historizable-object/create-abl.js");
const UpdateAbl = require("../../abl/historizable-object/update-abl.js");
const ListAbl = require("../../abl/historizable-object/list-abl.js");
const GetAbl = require("../../abl/historizable-object/get-abl.js");
const LoadAbl = require("../../abl/historizable-object/load-abl.js");
const SetStateAbl = require("../../abl/historizable-object/set-state-abl.js");
const SetStateClosedAbl = require("../../abl/historizable-object/set-state-closed-abl.js");
const DeleteAbl = require("../../abl/historizable-object/delete-abl.js");

class HistorizableObjectController {
  create(ucEnv) {
    return CreateAbl.create(ucEnv.getUri(), ucEnv.getDtoIn(), ucEnv.getSession());
  }

  _createFinalize(ucEnv) {
    return CreateAbl._createFinalize(ucEnv.getUri(), ucEnv.getDtoIn());
  }

  _createFinalizeRollback(ucEnv) {
    return CreateAbl._createFinalizeRollback(ucEnv.getUri(), ucEnv.getDtoIn());
  }

  get(ucEnv) {
    return GetAbl.get(ucEnv.getUri(), ucEnv.getDtoIn(), ucEnv.getSession());
  }

  load(ucEnv) {
    return LoadAbl.load(ucEnv.getUri(), ucEnv.getDtoIn(), ucEnv.getSession(), ucEnv.getAuthorizationResult());
  }

  list(ucEnv) {
    return ListAbl.list(ucEnv.getUri(), ucEnv.getDtoIn(), ucEnv.getSession());
  }

  update(ucEnv) {
    return UpdateAbl.update(ucEnv.getUri().getAwid(), ucEnv.getDtoIn());
  }

  setState(ucEnv) {
    return SetStateAbl.setState(ucEnv.getUri(), ucEnv.getDtoIn(), ucEnv.getSession());
  }

  setStateClosed(ucEnv) {
    return SetStateClosedAbl.setStateClosed(ucEnv.getUri(), ucEnv.getDtoIn(), ucEnv.getSession());
  }

  delete(ucEnv) {
    return DeleteAbl.delete(ucEnv.getUri(), ucEnv.getDtoIn(), ucEnv.getSession());
  }
}

module.exports = new HistorizableObjectController();
