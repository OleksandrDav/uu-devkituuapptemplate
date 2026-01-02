// doc:

//@@viewOn:imports
import { createVisualComponent } from "uu5g05";

import DataObjectStateResolver from "../../../stub/data-object-state-resolver";
import View from "./content/view";
import ViewPending from "./content/view-pending";
import ViewError from "./content/view-error";

import Config from "../../../config/config";
//@@viewOff:imports

//@@viewOn:statics
const STATICS = {
  uu5Tag: Config.TAG + "ActivityActionItem",
  nestingLevel: ["area", "inline"],
};
//@@viewOff:statics

//@@viewOn:css
//@@viewOff:css

//viewOn:helpers
//viewOff:helpers

const Content = createVisualComponent({
  ...STATICS,

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { historizableObjectListDto, ...propsToPass } = props;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <DataObjectStateResolver
        state={historizableObjectListDto.state}
        dataObject={historizableObjectListDto}
        readyComponent={<View historizableObject={historizableObjectListDto.data} {...propsToPass} />}
        pendingComponent={<ViewPending {...propsToPass} />}
        errorComponent={<ViewError errorData={historizableObjectListDto.errorData} {...propsToPass} />}
      />
    );
    //@@viewOff:render
  },
});

//viewOn:exports
export { Content };
export default Content;
//viewOff:exports
