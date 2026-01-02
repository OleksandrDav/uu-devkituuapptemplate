//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Plus4U5App from "uu_plus4u5g02-app";

import Uu5AppKit from "uu5appkitg01";
import UuArtifactApp from "uu_artifactg01-app";
import UuBusinessBrick from "uu_businessbrickg02";

import Config from "./config/config.js";
import Home from "../routes/home.js";
import HistorizableObject from "../routes/historizable-object.js";

const InitAppWorkspace = Utils.Component.lazy(() => import("../routes/init-app-workspace.js"));
const ControlPanel = Utils.Component.lazy(() => import("../routes/control-panel.js"));
//@@viewOff:imports

//@@viewOn:constants
const ROUTE_MAP = {
  "": { redirect: "home" },
  home: (props) => <Home {...props} />,
  "sys/uuAppWorkspace/initUve": (props) => <InitAppWorkspace {...props} />,
  historizableObjectDetail: (props) => <HistorizableObject {...props} />,

  controlPanel: (props) => <ControlPanel {...props} />,
  "*": () => (
    <Uu5Elements.Text category="story" segment="heading" type="h1">
      Not Found
    </Uu5Elements.Text>
  ),
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Spa = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Spa",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render() {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5AppKit.SpaProvider>
        <UuBusinessBrick.AwscProvider uuType="uu-devkituuapptemplate-maing01" schema="uuDevKitUuAppTemplate">
          <UuArtifactApp.Spa>
            <Plus4U5App.Router routeMap={ROUTE_MAP} />
          </UuArtifactApp.Spa>
        </UuBusinessBrick.AwscProvider>
      </Uu5AppKit.SpaProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Spa };
export default Spa;
//@@viewOff:exports
