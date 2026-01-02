//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import UuEcc from "uu_editablecomponentcontentg04";

import Config from "../../config/config.js";
//@@viewOff:imports

const Content = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Content",
  nestingLevel: ["route", "area", "spot", "inline"],
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ nestingLevel }) {
    //@@viewOn:private
    const pageDto = UuEcc.PageManagement.usePageContext();

    const currentNestingLevel = Utils.NestingLevel.getNestingLevel({ nestingLevel }, Content);
    //@@viewOff:private

    //@@viewOn:render
    if (currentNestingLevel === "inline") {
      return null;
    }

    return <UuEcc.Page {...pageDto} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Content };
export default Content;
//@@viewOff:exports
