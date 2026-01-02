//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";

import { HistorizableObjectListContext } from "./use-historizable-object-list.js";
import useHistorizableObjectListProvider from "./use-historizable-object-list-provider.js";

import Config from "./config/config.js";
//@@viewOff:imports

let HistorizableObjectListProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + `HistorizableObjectListProvider`,
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    baseUri: PropTypes.string,
    artifactId: PropTypes.string,
    excludeCompleted: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    excludeCompleted: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children, ...providerProps } = props;
    const value = useHistorizableObjectListProvider(providerProps);
    //@@viewOff:private

    // FIXME - component should properly render
    //@@viewOn:render
    return (
      <HistorizableObjectListContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </HistorizableObjectListContext.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { HistorizableObjectListProvider };
export default HistorizableObjectListProvider;
//@@viewOff:exports
