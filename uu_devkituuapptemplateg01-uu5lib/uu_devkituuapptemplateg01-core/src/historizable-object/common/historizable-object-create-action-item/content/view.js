// doc:

//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import { MenuItem, Button } from "uu5g05-elements";

import Config from "../../../../config/config";
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

const ActivityActionItem = createVisualComponent({
  ...STATICS,

  //@@viewOn:propTypes
  propTypes: {
    historizableObjectList: PropTypes.array,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    historizableObjectList: [],
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    // FIXME change to const after not faking activity list
    let { historizableObjectList, openHistorizableObjectCreateFormModal, displayType, ...propsToPass } = props;

    // TEMP - fixed count of activities, do count properly - should show count of my activities, not all activities
    //@@viewOff:private

    //@@viewOn:render
    return (
      <>
        {displayType === "menu-item" ? (
          <MenuItem
            {...propsToPass}
            onClick={openHistorizableObjectCreateFormModal}
            icon="uugds-plus"
            colorScheme="positive"
            elementAttrs={{ ...propsToPass?.elementAttrs }}
          >
            <div className={Config.Css.css({ display: "flex", justifyContent: "space-between", width: "100%" })}>
              Create HistorizableObject
            </div>
          </MenuItem>
        ) : (
          <Button
            {...propsToPass}
            onClick={openHistorizableObjectCreateFormModal}
            icon="uugds-plus"
            significance={"common"}
            colorScheme="positive"
            elementAttrs={{ ...propsToPass?.elementAttrs }}
            size="s"
          >
            Create HistorizableObject
          </Button>
        )}
      </>
    );

    //@@viewOff:render
  },
});

//viewOn:exports
export { ActivityActionItem };
export default ActivityActionItem;
//viewOff:exports
