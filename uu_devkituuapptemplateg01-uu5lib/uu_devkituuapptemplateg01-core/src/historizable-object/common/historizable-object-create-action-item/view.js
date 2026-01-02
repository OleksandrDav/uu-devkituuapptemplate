//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import { useModal } from "uu5g05-elements";

import { useHistorizableObjectList } from "uu_devkituuapptemplateg01";

import Content from "./content";
import HistorizableObjectCreateForm from "../historizable-object-create-form";

import Config from "../../../config/config";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const View = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "View",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { historizableObjectListDto } = useHistorizableObjectList();
    const [historizableObjectCreateFormModalProps, openHistorizableObjectCreateFormModal] = useModal();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <>
        <Content
          {...props}
          historizableObjectListDto={historizableObjectListDto}
          openHistorizableObjectCreateFormModal={openHistorizableObjectCreateFormModal}
        />
        {historizableObjectCreateFormModalProps.open ? (
          <HistorizableObjectCreateForm
            displayAsModal={true}
            open={true}
            onClose={historizableObjectCreateFormModalProps.onClose}
            width="full"
          />
        ) : null}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { View };
export default View;
//@@viewOff:exports
