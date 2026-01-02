//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils, useSession } from "uu5g05";
import { PlaceholderBox } from "uu5g05-elements";
import Config from "../config/config";
//@@viewOff:imports

//@@viewOn:css
const Css = {
  placeholder: (height) =>
    Config.Css.css({
      height,
      display: "flex",
      justifyContent: "center",
    }),
};
//@@viewOff:css

const HttpStatus = {
  BaseNetworkError: 0,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  InternalServerError: 500,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
};

export function getErrorStatus(errorData) {
  let status = errorData?.status;
  if (status === null || status === undefined) {
    return errorData?.error?.status;
  } else {
    return status;
  }
}

// FIXME - this should be standard component usable everywhere

const Error = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Error",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    errorData: PropTypes.object,
    customErrorLsi: PropTypes.object,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    errorData: {},
    customErrorLsi: {},
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { state } = useSession();
    //@@viewOff:private

    //@@viewOn:render
    const className = props.height
      ? Utils.Css.joinClassName(props.className, Css.placeholder(props.height))
      : props.className;

    const [elementProps] = Utils.VisualComponent.splitProps(props, className);
    const errorStatus = getErrorStatus(props.errorData);

    if (errorStatus === HttpStatus.Unauthorized || errorStatus === HttpStatus.Forbidden) {
      if (state === "authenticated") {
        return "Unauthorized";
      } else {
        return "Unauthenticated";
      }
    }

    return <PlaceholderBox {...elementProps} code="error" nestingLevel={props.nestingLevel} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Error };
export default Error;
//@@viewOff:exports
