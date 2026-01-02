//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import UuDevKitUuAppTemplate from "uu_devkituuapptemplateg01";

import View from "./list/view.js";

import Config from "../config/config";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const HistorizableObjectList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "HistorizableObjectList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render() {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:render
    return (
      <UuDevKitUuAppTemplate.HistorizableObjectListProvider>
        <View />
      </UuDevKitUuAppTemplate.HistorizableObjectListProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { HistorizableObjectList };
export default HistorizableObjectList;
//@@viewOff:exports
