//@@viewOn:imports
import { Utils, createVisualComponent, useRoute } from "uu5g05";
import { withRoute } from "uu_plus4u5g02-app";
import UuBusinessBrick from "uu_businessbrickg02";

import UuDevKitUuAppTemplateCore from "uu_devkituuapptemplateg01-core";

import Config from "./config/config.js";
//@@viewOff:imports

let InternalHistorizableObject = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "HistorizableObject",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { elementProps } = Utils.VisualComponent.splitProps(props);
    const [route] = useRoute();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <UuBusinessBrick.AtcProvider
        uuType="uu-devkituuapptemplate-maing01/historizableObject"
        schema="historizableObject"
        oid={route.params?.oid}
      >
        <UuDevKitUuAppTemplateCore.HistorizableObjectDetail {...elementProps} nestingLevel="route" />
      </UuBusinessBrick.AtcProvider>
    );
    //@@viewOff:render
  },
});

const HistorizableObject = withRoute(InternalHistorizableObject, { authenticated: true });

//@@viewOn:exports
export { HistorizableObject };
export default HistorizableObject;
//@@viewOff:exports
