//@@viewOn:imports
import { Utils, createVisualComponent } from "uu5g05";
import { withRoute } from "uu_plus4u5g02-app";

import UuDevKitUuAppTemplateCore from "uu_devkituuapptemplateg01-core";

import Config from "./config/config.js";
//@@viewOff:imports

let Home = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Home",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:render
    return <div>Home sweet</div>;
    //@@viewOff:render
  },
});

// const Home = withRoute(InternalHome, { authenticated: true });

//@@viewOn:exports
export { Home };
export default Home;
//@@viewOff:exports
