//@@viewOn:imports
import { createVisualComponent, PropTypes } from "uu5g05";
import { ArtifactProvider } from "uu_plus4u5g02";

import Config from "./config/config.js";
import View from "./artifact-link/view.js";
//@@viewOff:imports

const ArtifactLink = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "ArtifactLink",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...View.propTypes,
    baseUri: PropTypes.string,
    artifactId: PropTypes.string,
    data: PropTypes.object,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...View.defaultProps,
  },
  //@@viewOff:defaultProps

  render({ baseUri, artifactId, data, ...viewProps }) {
    //@@viewOn:render
    return (
      <ArtifactProvider baseUri={baseUri} artifactId={artifactId} data={data}>
        <View {...viewProps} />
      </ArtifactProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { ArtifactLink };
export default ArtifactLink;
//@@viewOff:exports
