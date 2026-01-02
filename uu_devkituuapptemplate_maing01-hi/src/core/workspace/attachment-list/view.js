//@@viewOn:imports
import { createVisualComponent, useLsi, Utils } from "uu5g05";
import { ContentContainer } from "uu_plus4u5g02-elements";
import DataObject from "../../../utils/data-object.js";
import useWorkspace from "../../../workspace/use-workspace.js";
import Config from "./config/config.js";
import importLsi from "../../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
const NESTING_LEVEL = ["route", "area", "spot", "inline"];
//@@viewOff:constants

const View = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "View",
  nestingLevel: ContentContainer.getComponentNestingLevel(NESTING_LEVEL),
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...ContentContainer.getComponentPropTypes(NESTING_LEVEL),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...ContentContainer.getComponentDefaultProps(NESTING_LEVEL),
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { baseUri, workspaceDto } = useWorkspace();
    const viewLsi = useLsi(importLsi, [View.uu5Tag]);
    //const info = useInfo(viewLsi.info, "UuDevKitUuAppTemplate.AttachmentList");

    const { elementAttrs, elementProps, componentProps } = Utils.VisualComponent.splitProps(props);
    //@@viewOff:private

    //@@viewOn:render
    return DataObject.hasData(workspaceDto) ? <div {...elementAttrs}></div> : null;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { View };
export default View;
//@@viewOff:exports
