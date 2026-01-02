//@@viewOn:imports
import { createVisualComponent } from "uu5g05";

import View from "./historizable-object-create-form/view";

import Config from "../../config/config";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const HistorizableObjectCreateForm = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "HistorizableObjectCreateForm",
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
    return <View {...props} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { HistorizableObjectCreateForm };
export default HistorizableObjectCreateForm;
//@@viewOff:exports
