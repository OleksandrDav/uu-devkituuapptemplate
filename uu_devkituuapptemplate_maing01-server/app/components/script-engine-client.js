"use strict";
const { UriBuilder } = require("uu_appg01_server").Uri;
const AppClient = require("uu_appg01_server").AppClient;
const { UseCaseContext } = require("uu_appg01_server").AppServer;

const Errors = require("../api/errors/script-engine-error");

const CODE_PARAM = "code";
const RUN_SCRIPT = "engine/runScript";
const LOG_MESSAGE = "console/logMessage";
class ScriptEngineClient {
  constructor({ scriptEngineUri, consoleUri, consoleCode, uuScriptRepositoryBaseUri, session }) {
    session ??= UseCaseContext.getSession();
    this.runScriptUri = UriBuilder.parse(scriptEngineUri).setUseCase(RUN_SCRIPT).toUri();
    // noinspection JSCheckFunctionSignatures,JSVoidFunctionReturnValueUsed,JSUnresolvedFunction
    this.logMessageUri = UriBuilder.parse(consoleUri)
      .setUseCase(LOG_MESSAGE)
      .setParameter(CODE_PARAM, consoleCode)
      .toUri();

    this.uuScriptRepositoryBaseUri = uuScriptRepositoryBaseUri;
    this.callOpts = { session };
  }

  async runScript({ scriptCode, scriptDtoIn }) {
    // noinspection JSVoidFunctionReturnValueUsed,JSCheckFunctionSignatures,JSUnresolvedFunction
    let scriptUri = UriBuilder.parse(this.uuScriptRepositoryBaseUri)
      .setUseCase("script/get")
      .setParameter(CODE_PARAM, scriptCode)
      .toUri();

    let runScriptDtoIn = {
      scriptUri,
      scriptName: scriptCode,
      scriptDtoIn,
      consoleUri: this.logMessageUri.toString(),
    };
    let dtoOut;
    try {
      dtoOut = await AppClient.cmdPost(this.runScriptUri, runScriptDtoIn, this.callOpts);
    } catch (e) {
      throw new Errors.CallScriptEngineFailed(
        {
          ...runScriptDtoIn,
          scriptEngineUri: this.runScriptUri,
        },
        e,
      );
    }

    return dtoOut;
  }

  static async runScript(
    scriptDtoIn,
    { scriptEngineUri, scriptCode, consoleUri, consoleCode, uuScriptRepositoryBaseUri, session },
  ) {
    return new this({ scriptEngineUri, consoleUri, consoleCode, uuScriptRepositoryBaseUri, session }).runScript(
      scriptCode,
      scriptDtoIn,
    );
  }
}

module.exports = ScriptEngineClient;