//@@viewOn:imports
import { createVisualComponent, DynamicLibraryComponent, useState, Lsi } from "uu5g05";
import UuArtifact from "uu_artifactg01";
import Uu5Elements from "uu5g05-elements";

import Config from "../../config/config.js";
import RetryForm from "./retry-form.js";
import RollbackForm from "./rollback-form.js";
import AwcsInfo from "../awsc-info.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({
      marginTop: "64px",
      justifyContent: "center",
      alignItems: "center",
    }),
  fixedHeight: () =>
    Config.Css.css({
      height: "16px",
    }),
  topMargin: () =>
    Config.Css.css({
      marginTop: "64px",
      marginLeft: "128px",
      marginRight: "128px",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const BeingInitializedAuthorized = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "BeingInitializedAuthorized",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render() {
    //@@viewOn:private

    const {
      dataObject: { data: artifactData },
    } = UuArtifact.useArtifact();
    const systemData = artifactData?.data?.territoryData;
    const [isInfoOpened, setIsInfoOpened] = useState(false);
    const [isRetryOpened, setIsRetryOpened] = useState(false);
    const [isRollbackOpened, setIsRollbackOpened] = useState(false);
    const [rollbackDtoIn, setRollbackDtoIn] = useState(false);
    const [disableButtons, setDisableButtons] = useState(false);
    const [retryDtoIn, setRetryDtoIn] = useState(false);

    if (artifactData?.data?.data?.temporaryData?.dtoIn.mode) {
      artifactData.data.temporaryData.dtoIn.mode = "retry";
    }

    const [showConsole, setShowConsole] = useState(!!artifactData?.data?.consoleCode);
    const [retryInputData, setRetryInputData] = useState(
      JSON.stringify({ force: false, mode: "retry", data: artifactData?.temporaryData?.dtoIn }, null, 2),
    );
    const [rollbackInputData, setRollbackInputData] = useState(
      JSON.stringify({ force: true, mode: "rollback", data: {} }, null, 2),
    );
    const consoleBaseUri = artifactData?.data?.temporaryData.progressMap.uuConsoleUri;
    const progressCode = artifactData?.data?.temporaryData.progressMap.progressCode;
    const consoleCode = artifactData?.data?.temporaryData.progressMap.consoleCode;

    const proceedWithConsole = 3;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <div className={Css.main()}>
        {isRetryOpened && (
          <RetryForm
            onClose={setIsRetryOpened}
            retryDtoIn={retryDtoIn}
            setRetryDtoIn={setRetryDtoIn}
            retryInputData={retryInputData}
            setRetryInputData={setRetryInputData}
            setDisableButtons={setDisableButtons}
            disableButtons={disableButtons}
          />
        )}
        {isRollbackOpened && (
          <RollbackForm
            onClose={setIsRollbackOpened}
            rollbackDtoIn={rollbackDtoIn}
            setRollbackDtoIn={setRollbackDtoIn}
            rollbackInputData={rollbackInputData}
            setRollbackInputData={setRollbackInputData}
            disableButtons={disableButtons}
            setDisableButtons={setDisableButtons}
          />
        )}
        {isInfoOpened && <AwcsInfo onClose={setIsInfoOpened} />}

        <Uu5Elements.PlaceholderBox
          code="folder"
          colorScheme="positive"
          header={<Lsi import={importLsi} path={["RetryInitForm", "beingInitializedHeader"]} />}
          info={
            <Lsi
              import={importLsi}
              path={["InitAppWorkspace", "beingInitializedAuthorizedInfo"]}
              params={[systemData?.awidData?.name || "uuAppWorkspace"]}
            />
          }
          actionList={[
            {
              disabled: disableButtons,
              children: <Lsi import={importLsi} path={["InitAppWorkspace", "getInfo"]} />,
              icon: "mdi-information-variant",
              onClick: () => setIsInfoOpened(true),
            },
            {
              children: <Lsi import={importLsi} path={["InitAppWorkspace", "retryInitialization"]} />,
              icon: "mdi-play",
              colorScheme: "primary",
              disabled: disableButtons,
              onClick: () => setIsRetryOpened(true),
            },
            {
              children: <Lsi import={importLsi} path={["InitAppWorkspace", "rollback"]} />,
              icon: "mdi-play",
              colorScheme: "primary",
              disabled: disableButtons,
              onClick: () => setIsRollbackOpened(true),
            },
          ]}
          actionDirection="horizontal"
        />
        <div className={Css.topMargin()}>
          <DynamicLibraryComponent
            uu5Tag="UuConsole.Progress"
            baseUri={consoleBaseUri}
            progressCode={progressCode}
            interval={2}
            onDataReloaded={(data) => {
              if (data.doneWork >= proceedWithConsole && showConsole === false) {
                setShowConsole(true);
              }
              if (data.state === "completed") setTimeout(() => location.reload(), 2000);
            }}
          />
          {showConsole ? (
            <DynamicLibraryComponent
              interval={5}
              uu5Tag="UuConsole.Console"
              baseUri={consoleBaseUri}
              consoleCode={consoleCode}
            />
          ) : (
            <div className={Css.topMargin()}>
              <Uu5Elements.PlaceholderBox
                code="timer"
                info={<Lsi import={importLsi} path={["InitAppWorkspace", "waitForConsoleInfo"]} />}
              />
            </div>
          )}
        </div>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { BeingInitializedAuthorized };
export default BeingInitializedAuthorized;
//@@viewOff:exports
