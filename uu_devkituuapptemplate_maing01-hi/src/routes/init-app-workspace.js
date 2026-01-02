//@@viewOn:imports
import { createVisualComponent, useDataObject } from "uu5g05";
import UuArtifact from "uu_artifactg01";
import Plus4U5App, { withRoute } from "uu_plus4u5g02-app";
import Calls from "calls";

import Config from "./config/config.js";
import InitAuthorized from "../core/init-components/init-authorized.js";
import NotAuthorized from "../core/init-components/not-authorized.js";
import BeingInitializedAuthorized from "../core/init-components/being-initialized-authorized.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({
      maxWidth: 1024,
      margin: "auto",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

let InitAppWorkspace = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "InitAppWorkspace",
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
    const { data, state } = useDataObject({
      handlerMap: { load: Calls.loadIdentityProfiles },
    });
    //@@viewOff:private

    //@@viewOn:render
    let child;
    if (state === "pending" || state === "pendingNoData") {
      child = <Plus4U5App.SpaPending />;
    } else if (!Array.isArray(data?.authorizedProfileList) || !data?.authorizedProfileList?.length) {
      // user is not authorized to init / retry init
      child = <NotAuthorized />;
    } else {
      if (!artifactData?.data?.state) {
        // uuApp being initialized for the first time
        child = <InitAuthorized />;
      } else {
        // uuApp being initialized before (there is uuApp state)
        child = <BeingInitializedAuthorized />;
      }
    }

    return <div className={Css.main()}>{child}</div>;
  },
  //@@viewOff:render
});

InitAppWorkspace = withRoute(InitAppWorkspace, { authenticated: true });

//@@viewOn:exports
export { InitAppWorkspace };
export default InitAppWorkspace;
//@@viewOff:exports
