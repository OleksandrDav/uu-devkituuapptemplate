//@@viewOn:imports
import { createVisualComponent, Lsi, useCall, useState, useRef, ErrorBoundary } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5CodeKit from "uu5codekitg01";
import Calls from "calls";

import Config from "../config/config.js";
import { validateDtoIn } from "./common-methods.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  input: () => Config.Css.css({ marginTop: 16 }),
  formControls: () =>
    Config.Css.css({
      textAlign: "right",
    }),
  data: () =>
    Config.Css.css({
      maxWidth: 1024,
      margin: "auto",
    }),
  noBottomMargin: () =>
    Config.Css.css({
      marginBottom: "0px!important",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
async function retry(props, addAlert, setOpenModal, modalDataRef) {
  const { dtoIn, isValid } = validateDtoIn(props.retryInputData, addAlert);
  if (isValid) {
    let workspace;
    try {
      props.setDisableButtons(true);
      workspace = await Calls.initWorkspace(dtoIn);

      addAlert({
        header: <Lsi import={importLsi} path={["InitAppWorkspace", "uuCmdSuccess"]} />,
        message: <Lsi import={importLsi} path={["InitAppWorkspace", "uuCmdSuccessMessage"]} />,
        priority: "success",
        durationMs: 3000,
      });
      setTimeout(() => location.reload(), 3000);
    } catch (e) {
      modalDataRef.current = { header: e.message, dtoOut: e.dtoOut };
      props.setDisableButtons(false);
      setOpenModal(true);
      addAlert({
        header: <Lsi import={importLsi} path={["InitAppWorkspace", "initCmdFailed"]} />,
        message: e.message,
        priority: "error",
        durationMs: 2000,
      });
    }

    return workspace;
  }
}
//@@viewOff:helpers

const RetryForm = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "RetryForm",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { addAlert } = Uu5Elements.useAlertBus();
    const [open, setOpenModal] = useState(false);
    const modalDataRef = useRef();

    const { state: retryState, call: retryCall } = useCall(retry);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.ModalBus>
        <Uu5Elements.Modal
          width="full"
          header={
            <Uu5Elements.Text category="story" segment="heading" type="h2">
              <Lsi import={importLsi} path={["InitAppWorkspace", "retryInitialization"]} />
            </Uu5Elements.Text>
          }
          footer={
            <Uu5Elements.ActionGroup
              className={Css.formControls()}
              itemList={[
                {
                  icon: "mdi-close",
                  children: <Lsi import={importLsi} path={["InitAppWorkspace", "close"]} />,
                  significance: "common",
                  disabled: retryState.includes("pending"),
                  onClick: () => props.onClose(false),
                },
                {
                  icon: "mdi-play",
                  children: <Lsi import={importLsi} path={["InitAppWorkspace", "retryInitialization"]} />,
                  colorScheme: "primary",
                  significance: "highlighted",
                  disabled: props.disableButtons,
                  onClick: () => retryCall(props, addAlert, setOpenModal, modalDataRef),
                },
              ]}
            />
          }
          actionList={retryState.includes("pending") ? [{ icon: "mdi-loading mdi-spin" }] : undefined}
          info={<Lsi import={importLsi} path={["InitAppWorkspace", "retryFormHeaderInfo"]} />}
          open
          onClose={() => props.onClose(false)}
        >
          <Uu5CodeKit.Json
            className={Css.noBottomMargin()}
            spacing={0}
            name="dtoIn"
            format="pretty"
            rows={15}
            controlled
            value={props.retryInputData}
            disabled={retryState.includes("pending")}
            onBlur={(e) => {
              props.setRetryInputData(e.data.value);
            }}
          />

          <Uu5Elements.Modal
            colorScheme="warning"
            width="full"
            open={open}
            header={<ErrorBoundary>{modalDataRef?.current?.header}</ErrorBoundary>}
            onClose={() => setOpenModal(false)}
          >
            <Uu5CodeKit.Json
              className={Css.noBottomMargin()}
              spacing={0}
              format="pretty"
              rows={15}
              controlled
              value={modalDataRef?.current?.dtoOut}
              readOnly
            />
          </Uu5Elements.Modal>
        </Uu5Elements.Modal>
      </Uu5Elements.ModalBus>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { RetryForm };
export default RetryForm;
//@@viewOff:exports
