//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";

import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () =>
    Config.Css.css({
      minHeight: "70vh",
      maxWidth: "480px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      margin: "0 auto",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const NotAuthorized = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "NotAuthorized",
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
    return (
      <div className={Css.main()}>
        <Uu5Elements.PlaceholderBox
          code="permission"
          colorScheme="negative"
          header={<Lsi import={importLsi} path={["InitAppWorkspace", "notInitializedHeader"]} />}
          info={<Lsi import={importLsi} path={["InitAppWorkspace", "notAuthorizedInfo"]} />}
        />
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { NotAuthorized };
export default NotAuthorized;
//@@viewOff:exports
