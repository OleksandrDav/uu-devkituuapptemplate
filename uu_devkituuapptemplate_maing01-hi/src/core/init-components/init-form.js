//@@viewOn:imports
import { createVisualComponent, Lsi, useCall, useRef, useState } from "uu5g05";
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
async function initialize(
  inputData,
  addAlert,
  setShouldReload,
  modalDataRef,
  setOpenModal,
  setIsInitInProcess,
  setInitInProgress,
) {
  const { dtoIn, isValid } = validateDtoIn(inputData, addAlert);

  if (isValid) {
    let workspace;
    try {
      setIsInitInProcess(true);
      setInitInProgress(true);
      workspace = await Calls.initWorkspace(dtoIn);
      addAlert({
        header: <Lsi import={importLsi} path={["InitAppWorkspace", "uuCmdSuccess"]} />,
        message: <Lsi import={importLsi} path={["InitAppWorkspace", "uuCmdSuccessMessage"]} />,
        priority: "success",
        durationMs: 3000,
      });
      setTimeout(() => location.reload(), 3000);
    } catch (e) {
      if (e?.dtoOut?.uuAppErrorMap?.canExecuteRollBack) setShouldReload(true);
      modalDataRef.current = { header: e.message, dtoOut: e.dtoOut };
      setOpenModal(true);
      addAlert({
        header: <Lsi import={importLsi} path={["InitAppWorkspace", "initCmdFailed"]} />,
        message: e.message,
        priority: "error",
        durationMs: 2000,
      });
      setIsInitInProcess(false);
      setInitInProgress(false);
    }
    return workspace;
  }
}
//@@viewOff:helpers

const InitForm = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InitForm",
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
    const [shouldReloadOnFailInit, setShouldReload] = useState(false);
    const [initInProgress, setInitInProgress] = useState(false);
    const [open, setOpenModal] = useState(false);
    const modalDataRef = useRef();
    const { state: initializeState, call: initializeCall } = useCall(initialize);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.ModalBus>
        <Uu5Elements.Modal
          width="full"
          header={
            <Uu5Elements.Text category="story" segment="heading" type="h2">
              <Lsi import={importLsi} path={["InitAppWorkspace", "formHeader"]} />
            </Uu5Elements.Text>
          }
          footer={
            <Uu5Elements.ActionGroup
              className={Css.formControls()}
              itemList={[
                {
                  icon: "mdi-information",
                  children: <Lsi import={importLsi} path={["InitAppWorkspace", "getInfo"]} />,
                  significance: "common",
                  disabled: initializeState.includes("pending"),
                  onClick: () => {
                    props.isInfoOpened ? props.onClose(false) : props.setIsInfoOpened(true);
                  },
                },
                {
                  icon: "mdi-close",
                  children: <Lsi import={importLsi} path={["InitAppWorkspace", "close"]} />,
                  significance: "common",
                  disabled: initializeState.includes("pending"),
                  onClick: () => props.onClose(false),
                },
                {
                  icon: "mdi-play",
                  children: <Lsi import={importLsi} path={["InitAppWorkspace", "initialize"]} />,
                  colorScheme: "primary",
                  significance: "highlighted",
                  disabled: initInProgress || initializeState.includes("pending"),
                  onClick: () => {
                    initializeCall(
                      props.inputData,
                      addAlert,
                      setShouldReload,
                      modalDataRef,
                      setOpenModal,
                      props.setIsInitInProcess,
                      setInitInProgress,
                    );
                  },
                },
              ]}
            />
          }
          actionList={initializeState.includes("pending") ? [{ icon: "mdi-loading mdi-spin" }] : undefined}
          info={<Lsi import={importLsi} path={["InitAppWorkspace", "formHeaderInfo"]} />}
          open
          onClose={() => {
            props.onClose(false);
          }}
        >
          <Uu5CodeKit.Json
            className={Css.noBottomMargin()}
            spacing={0}
            name="dtoIn"
            format="pretty"
            rows={15}
            controlled
            value={props.inputData}
            disabled={initializeState.includes("pending")}
            onBlur={(e) => {
              props.setInputData(e.data.value);
            }}
          />
          <Uu5Elements.Modal
            colorScheme="warning"
            width="full"
            open={open}
            header={modalDataRef?.current?.header}
            onClose={() => {
              setOpenModal(false);
              if (shouldReloadOnFailInit) {
                location.reload();
              }
            }}
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
export { InitForm };
export default InitForm;
//@@viewOff:exports
