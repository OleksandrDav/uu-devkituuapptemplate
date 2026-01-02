import State from "./workspace/state";
import Types from "./workspace/types";

const Keys = Object.freeze({
  NAME: "name",
  DESC: "desc",
  STATE: "state",
});

const UseCaseMap = Object.freeze({});

export default class Workspace {
  static get APP_CODE() {
    return "uu-devkituuapptemplate-maing01";
  }

  static get APP_TYPE() {
    return "uuDevKitUuAppTemplate";
  }

  static get HISTORY_TYPE() {
    return "historizable";
  }

  static get ECC_HISTORY_TYPE() {
    return "historizable";
  }

  static get EBC_HISTORY_TYPE() {
    return "historizable";
  }

  static get Types() {
    return Types;
  }

  static get State() {
    return State;
  }

  static get Keys() {
    return Keys;
  }

  static get UseCaseMap() {
    return UseCaseMap;
  }
}
