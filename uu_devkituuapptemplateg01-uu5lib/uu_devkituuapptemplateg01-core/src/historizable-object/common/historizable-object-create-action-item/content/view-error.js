// doc:

//@@viewOn:imports
import { createVisualComponent, useLsi } from "uu5g05";
import { MenuItem, Badge, Button, useModal, Modal } from "uu5g05-elements";

import Error from "../../../../stub/error";

import Config from "../../../../config/config";
//@@viewOff:imports

//@@viewOn:statics
const STATICS = {
  uu5Tag: Config.TAG + "ViewError",
  nestingLevel: ["area", "inline"],
};
//@@viewOff:statics

//@@viewOn:css
//@@viewOff:css

//viewOn:helpers
function ErrorModal({ open, onClose, errorData }) {
  return (
    <Modal header="Failed to load activity list" open={open} onClose={onClose}>
      <Error errorData={errorData} />
    </Modal>
  );
}
//viewOff:helpers

const ViewError = createVisualComponent({
  ...STATICS,

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { displayType, errorData, ...propsToPass } = props;
    const [modalProps, openModal] = useModal();

    function getChildren() {
      if (displayType === "menu-item") {
        return (
          <>
            <MenuItem
              {...propsToPass}
              icon="uugds-activity"
              elementAttrs={{ ...propsToPass?.elementAttrs }}
              onClick={openModal}
            >
              <div className={Config.Css.css({ display: "flex", justifyContent: "space-between", width: "100%" })}>
                Create
                <Badge colorScheme={"negative"} size="m">
                  {"!"}
                </Badge>
              </div>
            </MenuItem>
            <ErrorModal {...modalProps} errorData={errorData} />
          </>
        );
      } else {
        return (
          <>
            <Button
              {...propsToPass}
              icon="uugds-activity"
              significance={"subdued"}
              colorScheme={"negative"}
              elementAttrs={{ ...propsToPass?.elementAttrs }}
              onClick={openModal}
            >
              {"!"}
            </Button>
            <ErrorModal {...modalProps} errorData={errorData} />
          </>
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
export { ViewError };
export default ViewError;
//viewOff:exports
