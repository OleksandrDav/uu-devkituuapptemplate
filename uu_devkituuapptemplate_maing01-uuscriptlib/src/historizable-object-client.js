const AppClient = require("uu_appg01_server").AppClient;
const { UseCaseError } = require("uu_appg01_server").AppServer;

const { session, dtoOut, console } = scriptContext;

/*@@viewOn:names*/
const Names = {
  SCRIPT_LIB_NAME: "uu_historizableObjectg01-uuscriptlib",
  CLASS_NAME: "HistorizableObjectClient",
};
/*@@viewOff:names*/

/*@@viewOn:errors*/
const Errors = {
  ERROR_PREFIX: `${Names.SCRIPT_LIB_NAME}/${Names.CLASS_NAME}/`,

  LoadUuHistorizableObjectFailed: class extends UseCaseError {
    constructor(paramMap, cause) {
      super({ dtoOut, paramMap, status: 400 }, cause);
      this.message = "Calling sys/uuAppWorkspace/load failed.";
      this.code = `${Errors.ERROR_PREFIX}loadUuHistorizableObjectFailed`;
    }
  },

  GetUuHistorizableObjectFailed: class extends UseCaseError {
    constructor(paramMap, cause) {
      super({ dtoOut, paramMap, status: 400 }, cause);
      this.message = "Calling sys/uuAppWorkspace/get failed.";
      this.code = `${Errors.ERROR_PREFIX}getUuHistorizableObjectFailed`;
    }
  },

  ListUuHistorizableObjectFailed: class extends UseCaseError {
    constructor(paramMap, cause) {
      super({ dtoOut, paramMap, status: 400 }, cause);
      this.message = "Calling historizableObject/list failed.";
      this.code = `${Errors.ERROR_PREFIX}listUuHistorizableObjectFailed`;
    }
  },

  SetStateClosedUuHistorizableObjectFailed: class extends UseCaseError {
    constructor(paramMap, cause) {
      super({ dtoOut, paramMap, status: 400 }, cause);
      this.message = "Calling historizableObject/setStateClosed failed.";
      this.code = `${Errors.ERROR_PREFIX}setStateClosedUuHistorizableObjectFailed`;
    }
  },
};

/*@@viewOff:errors*/

class HistorizableObjectClient {
  constructor(baseUri) {
    this.appClient = new AppClient({ baseUri, session });
    // base uri can be used as parameter in error
    this.baseUri = baseUri;
  }

  async load() {
    let historizableObject;
    try {
      historizableObject = await this.appClient.cmdGet("historizableObject/load");
    } catch (e) {
      await console.error(e);
      throw new Errors.LoadUuHistorizableObjectFailed({ baseUri: this.baseUri }, e);
    }
    return historizableObject;
  }

  async get() {
    let historizableObject;
    try {
      historizableObject = await this.appClient.cmdGet("historizableObject/get");
    } catch (e) {
      throw new Errors.GetUuHistorizableObjectFailed({ baseUri: this.baseUri }, e);
    }
    return historizableObject;
  }

  async list() {
    await console.info(session);
    let historizableObject;
    try {
      historizableObject = await this.appClient.cmdGet("historizableObject/list");
    } catch (e) {
      throw new Errors.ListUuHistorizableObjectFailed({ baseUri: this.baseUri }, e);
    }
    return historizableObject;
  }

  async setStateClosed(dtoIn) {
    let historizableObject;
    try {
      historizableObject = await this.appClient.cmdPost("historizableObject/setStateClosed", dtoIn);
    } catch (e) {
      await console.error(e);
      throw new Errors.SetStateClosedUuHistorizableObjectFailed({ baseUri: this.baseUri }, e);
    }
    return historizableObject;
  }
}

module.exports = HistorizableObjectClient;
