//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";
import { Pending } from "uu5g05-elements";
import Config from "../config/config";
import Error from "./error";
//@@viewOff:imports

// FIXME - this should be standard component usable everywhere

export const DataObjectStateResolver = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "DataObjectStateResolver",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    dataObject: PropTypes.object.isRequired,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    customErrorLsi: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    height: "100%",
    customErrorLsi: {},
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { state, errorData, readyComponent, errorComponent, pendingComponent } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let child = null;
    const { customErrorLsi, ...viewProps } = props;
    switch (state) {
      case "ready":
      case "pending":
      case "itemPending": {
        child = readyComponent;
        break;
      }
      case "errorNoData": {
        child = errorComponent || <Error {...viewProps} errorData={errorData} customErrorLsi={customErrorLsi} />;
        break;
      }
      case "readyNoData":
      case "pendingNoData": {
        child = pendingComponent || <Pending {...viewProps} />;
        break;
      }
      default: {
        child = "";
      }
    }

    return child;
    //@@viewOff:render
  },
});

export default DataObjectStateResolver;
