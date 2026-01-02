import { PropTypes } from "uu5g05";
import State from "./state";

class Types {
  static Keys = {
    state: PropTypes.oneOf(State.list()),
    data: PropTypes.any,
    errorData: PropTypes.exact({
      operation: PropTypes.string.isRequired,
      dtoIn: PropTypes.any,
      error: PropTypes.any,
      data: PropTypes.any,
    }),
    pendingData: PropTypes.exact({ operation: PropTypes.string.isRequired, dtoIn: PropTypes.any }),
    handlerMap: PropTypes.shape({
      setData: PropTypes.func,
      load: PropTypes.func,
    }),
  };

  static Instance = PropTypes.exact({
    state: Types.Keys.state.isRequired,
    errorData: Types.Keys.errorData,
    data: Types.Keys.data,
    pendingData: Types.Keys.pendingData,
    handlerMap: Types.Keys.handlerMap,
  });
}

export { Types };
export default Types;
