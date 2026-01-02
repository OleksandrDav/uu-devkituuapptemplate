//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";

import { HistorizableObjectContext } from "./use-historizable-object.js";
import useProvider from "./use-historizable-object-provider.js";

import Config from "./config/config.js";
//@@viewOff:imports

let HistorizableObjectProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + `HistorizableObjectProvider`,
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    baseUri: PropTypes.string,
    oid: PropTypes.string,
    skipInitialLoad: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, ...providerProps } = props;
    const value = useProvider(providerProps);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <HistorizableObjectContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </HistorizableObjectContext.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { HistorizableObjectProvider };
export default HistorizableObjectProvider;
//@@viewOff:exports
