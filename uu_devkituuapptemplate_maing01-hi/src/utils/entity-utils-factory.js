import Workspace from "./workspace";

export default class EntityUtilsFactory {
  static createEntityUtils(appType) {
    switch (appType) {
      case Workspace.APP_TYPE:
        return Workspace;

      default:
        throw new Error(`Utility class of ${appType} does not exist.`);
    }
  }

  static createEntityAppTypeList() {
    return [Workspace.APP_TYPE];
  }
}
