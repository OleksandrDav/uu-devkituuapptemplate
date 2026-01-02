"use strict";
const { UseCaseContext } = require("uu_appg01_server").AppServer;

const MIDDLEWARE_ORDER = -5;

/**
 * Middleware class for setting the uuAppErrorMap attribute in the UseCaseContext.
 * Need to use this object as uuAppErrorMap inside cmds.
 *  Can get this object inside useCase through UseCaseContext.getAttribute("uuAppErrorMap").
 */
class UuAppErrorMapContext {
  constructor() {
    this.order = MIDDLEWARE_ORDER;
  }

  pre(req, res, next) {
    UseCaseContext.setAttribute("uuAppErrorMap", {});
    return next();
  }
}

module.exports = UuAppErrorMapContext;
