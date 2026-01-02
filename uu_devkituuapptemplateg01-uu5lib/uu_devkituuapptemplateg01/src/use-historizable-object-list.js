//@@viewOn:imports
import { Utils } from "uu5g05";
import Config from "./config/config.js";
//@@viewOff:imports

export const [HistorizableObjectListContext, useHistorizableObjectList] = Utils.Context.create(
  undefined,
  Config.TAG + "HistorizableObjectContext",
);
export default useHistorizableObjectList;
