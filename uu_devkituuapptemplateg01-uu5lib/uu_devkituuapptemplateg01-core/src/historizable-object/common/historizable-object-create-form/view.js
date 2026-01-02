//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import { UuGds } from "uu5g05-elements";
import { Form, FormText, FormTextArea, CancelButton, SubmitButton } from "uu5g05-forms";
import Uu5ComponentKitCore from "uu5componentkitg01-core";

import { useHistorizableObjectList } from "uu_devkituuapptemplateg01";

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
  propTypes: { historizableObjectListDto: PropTypes.object },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { historizableObjectListDto } = useHistorizableObjectList();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Form.Provider
        onSubmit={async (e) => {
          await historizableObjectListDto.handlerMap.create(e.data.value);
          props.onClose();
        }}
      >
        <Uu5ComponentKitCore.ContentContainer
          {...props}
          title={"Create HistorizableObject"}
          footer={
            <div
              className={Config.Css.css({
                display: "flex",
                justifyContent: "end",
                gap: UuGds.SpacingPalette.getValue(["fixed", "c"]),
              })}
            >
              <CancelButton onClick={props.onClose} />
              <SubmitButton>Submit</SubmitButton>
            </div>
          }
        >
          <Form.View layout={"name, desc"}>
            <FormText name="name" label="Name" required />
            <FormTextArea name="desc" label="Description" />
          </Form.View>
        </Uu5ComponentKitCore.ContentContainer>
      </Form.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { View };
export default View;
//@@viewOff:exports
