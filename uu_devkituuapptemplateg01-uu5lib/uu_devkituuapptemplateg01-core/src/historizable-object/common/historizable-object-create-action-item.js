//@@viewOn:imports
import { createVisualComponent } from "uu5g05";

import { HistorizableObjectProvider } from "uu_devkituuapptemplateg01";
import View from "./historizable-object-create-action-item/view";

import Config from "../../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const HistorizableObjectCreateActionItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ActivityActionItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    // FIXME - should render artifactProvider (AWSC or ATC provider or both if necessary)
    // let { baseUri, oid } = props;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <HistorizableObjectProvider>
        <View {...props} />
      </HistorizableObjectProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { HistorizableObjectCreateActionItem };
export default HistorizableObjectCreateActionItem;
//@@viewOff:exports
