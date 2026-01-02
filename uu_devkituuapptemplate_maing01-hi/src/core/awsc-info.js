//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5CodeKit from "uu5codekitg01";
import UuArtifact from "uu_artifactg01";

import Config from "./config/config.js";
import importLsi from "../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  formControls: () =>
    Config.Css.css({
      textAlign: "right",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const AwcsInfo = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AwcsInfo",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const {
      dataObject: { data: artifactData },
    } = UuArtifact.useArtifact();
    const systemWorkspaceData = artifactData?.data?.territoryData;
    const uuDevKitUuAppTemplateMaing01 = artifactData?.data;

    function getItemList() {
      const itemList = [
        {
          icon: "mdi-close",
          children: <Lsi import={importLsi} path={["InitAppWorkspace", "close"]} />,
          significance: "common",
          onClick: () => props.onClose(false),
        },
      ];
      if (props.setIsInitializeOpened) {
        itemList.push({
          icon: "mdi-play",
          children: <Lsi import={importLsi} path={["InitAppWorkspace", "openInitialize"]} />,
          significance: "common",
          onClick: () => {
            props.isInitializeOpened ? props.onClose(false) : props.setIsInitializeOpened(true);
          },
        });
      }
      return itemList;
    }
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.Modal
        header={
          <Uu5Elements.Text category="story" segment="heading" type="h2">
            <Lsi import={importLsi} path={["InitAppWorkspace", "infoHeader"]} />
          </Uu5Elements.Text>
        }
        footer={<Uu5Elements.ActionGroup className={Css.formControls()} itemList={getItemList()} />}
        open
        onClose={() => props.onClose(false)}
      >
        <Uu5CodeKit.Code
          value={JSON.stringify({ uuDevKitUuAppTemplateMaing01, systemWorkspaceData }, null, 2)}
          codeStyle="json"
          showGutter
        />
      </Uu5Elements.Modal>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { AwcsInfo };
export default AwcsInfo;
//@@viewOff:exports
