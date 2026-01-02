// doc:

//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import { MenuItem, Badge, Button, Pending } from "uu5g05-elements";

import Config from "../../../../config/config";
//@@viewOff:imports

//@@viewOn:statics
const STATICS = {
  uu5Tag: Config.TAG + "ViewPending",
  nestingLevel: ["area", "inline"],
};
//@@viewOff:statics

//@@viewOn:css
//@@viewOff:css

//viewOn:helpers
//viewOff:helpers

const ViewPending = createVisualComponent({
  ...STATICS,

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { displayType, ...propsToPass } = props;

    function getChildren() {
      if (displayType === "menu-item") {
        return (
          <MenuItem {...propsToPass} icon="uugds-activity">
            <div className={Config.Css.css({ display: "flex", justifyContent: "space-between", width: "100%" })}>
              Create
              <Badge colorScheme={"primary"} size="m">
                {<Pending nestingLevel="inline" />}
              </Badge>
            </div>
          </MenuItem>
        );
      } else {
        return (
          <Button {...propsToPass} icon="uugds-activity" significance={"subdued"} colorScheme={"primary"}>
            {<Pending nestingLevel="inline" />}
          </Button>
        );
      }
    }
    //@@viewOff:private

    //@@viewOn:render
    return getChildren();
    //@@viewOff:render
  },
});

//viewOn:exports
export { ViewPending };
export default ViewPending;
//viewOff:exports
