//@@viewOn:imports
import { createVisualComponent, Lsi, useCall, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5CodeKit from "uu5codekitg01";
import Calls from "calls";

import Config from "../config/config.js";
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
async function initialize(props, addAlert, setRollbackInProgress) {
  let dtoIn = JSON.parse(props.rollbackInputData);
  if (dtoIn.mode !== "rollback") {
    addAlert({
      header: <Lsi import={importLsi} path={["InitAppWorkspace", "wrongDtoInFormat"]} />,
      message: <Lsi import={importLsi} path={["InitAppWorkspace", "wrongRollbackMode"]} />,
      priority: "error",
      durationMs: 3000,
    });
    return;
  }

  let workspace;
  try {
    props.setDisableButtons(true);
    setRollbackInProgress(true);
    workspace = await Calls.initWorkspace(dtoIn);
    addAlert({
      header: <Lsi import={importLsi} path={["InitAppWorkspace", "uuCmdSuccessRollback"]} />,
      message: <Lsi import={importLsi} path={["InitAppWorkspace", "uuCmdSuccessRollbackMessage"]} />,
      priority: "success",
      durationMs: 3000,
    });
    setTimeout(() => location.reload(), 3000);
  } catch (e) {
    addAlert({
      header: <Lsi import={importLsi} path={["InitAppWorkspace", "initCmdFailed"]} />,
      message: e.message,
      priority: "error",
    });
    props.setDisableButtons(false);
    setRollbackInProgress(false);
  }

  return workspace;
}
//@@viewOff:helpers

const RollbackForm = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "RollbackForm",
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
    const [rollbackInProgress, setRollbackInProgress] = useState(false);
    const { state: initializeState, call: rollbackCall } = useCall(initialize);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.Modal
        header={
          <Uu5Elements.Text category="story" segment="heading" type="h2">
            <Lsi import={importLsi} path={["InitAppWorkspace", "rollbackInitialization"]} />
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
                disabled: initializeState.includes("pending"),
                onClick: () => props.onClose(false),
              },
              {
                icon: "mdi-play",
                children: <Lsi import={importLsi} path={["InitAppWorkspace", "rollbackInitialization"]} />,
                colorScheme: "primary",
                significance: "highlighted",
                disabled: rollbackInProgress || initializeState.includes("pending"),
                onClick: () => rollbackCall(props, addAlert, setRollbackInProgress),
              },
            ]}
          />
        }
        actionList={initializeState.includes("pending") ? [{ icon: "mdi-loading mdi-spin" }] : undefined}
        info={<Lsi import={importLsi} path={["InitAppWorkspace", "formHeaderInfo"]} />}
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
          value={props.rollbackInputData}
          disabled={initializeState.includes("pending")}
          onBlur={(e) => props.setRollbackInputData(e.data.value)}
        />
      </Uu5Elements.Modal>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { RollbackForm };
export default RollbackForm;
//@@viewOff:exports
