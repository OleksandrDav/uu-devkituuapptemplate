//@@viewOn:imports
import { createComponent, PropTypes, useMemo } from "uu5g05";
import { ArtifactProvider, withReusedParentProvider, withBaseUri } from "uu_plus4u5g02";

import Calls from "calls";
import Config from "./config/config.js";
import Workspace from "../utils/workspace.js";
import useWorkspace, { WorkspaceContext } from "./use-workspace.js";
//@@viewOff:imports

//@@viewOn:helpers
function WorkspaceProvider({ baseUri, children }) {
  const value = useMemo(() => ({ workspaceDto, baseUri }), [workspaceDto, baseUri]);

  return (
    <ArtifactProvider data={workspaceDto?.data.territoryData}>
      <WorkspaceContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </WorkspaceContext.Provider>
    </ArtifactProvider>
  );
}
//@@viewOff:helpers

let Provider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + `Provider`,
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: { baseUri: PropTypes.string, skipInitialLoad: PropTypes.bool },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: { skipInitialLoad: false },
  //@@viewOff:defaultProps

  render({ baseUri, skipInitialLoad, children }) {
    //@@viewOn:private
    const handlerMap = useMemo(
      () => ({
        load() {
          return Calls.Workspace.load(baseUri);
        },
      }),
      [baseUri],
    );
    //@@viewOff:private

    //@@viewOn:render
    return <WorkspaceProvider baseUri={baseUri}>{children}</WorkspaceProvider>;
    //@@viewOff:render
  },
});

Provider = withReusedParentProvider(Provider, (props) => {
  const parentValue = useWorkspace();

  if (!parentValue) {
    return;
  }

  if (props.baseUri && props.baseUri !== parentValue.baseUri) {
    return;
  }

  return parentValue;
});

Provider = withBaseUri(Provider);

//@@viewOn:exports
export { Provider };
export default Provider;
//@@viewOff:exports
