//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import UuTElements from "uu_tg01-elements";
import { useArtifact } from "uu_plus4u5g02";
import { DataStateResolver } from "uu_plus4u5g02-elements";

import Config from "./config/config.js";
import DataObject from "../../utils/data-object.js";
//@@viewOff:imports

//@@viewOn:helpers
function getProps(artifact, context) {
  if (!artifact || !context) return {};
  if (artifact.mainUuIdentity) {
    return {
      baseUri: context.territory.uuTerritoryBaseUri,
      artifactId: artifact.id,
      uuIdentity: artifact.mainUuIdentity,
      uuIdentityName: artifact.mainUuIdentityName,
      displayUuIdentity: artifact.mainUuIdentity,
    };
  } else {
    return {
      baseUri: context.territory.uuTerritoryBaseUri,
      artifactId: artifact.id,
      href: artifact.uuObjectUri ?? artifact.uuAppWorkspaceUri,
      stateName: artifact.stateName,
      stateIcon: artifact.stateIcon,
      typeIcon: artifact.typeIcon,
    };
  }
}
//@@viewOff:helpers

const View = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "View",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    ...UuTElements.ArtifactLink.propTypes,
    showNameOnly: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    ...UuTElements.ArtifactLink.defaultProps,
    showNameOnly: false,
  },
  //@@viewOff:defaultProps

  render({ showNameOnly, ...otherProps }) {
    //@@viewOn:private
    const artifactDto = useArtifact();
    const artifact = artifactDto?.data?.artifact;
    const context = artifactDto?.data?.context;

    const { elementProps, componentProps } = Utils.VisualComponent.splitProps(otherProps);
    //@@viewOff:private

    //@@viewOn:render
    if (showNameOnly) return artifact?.name;
    return (
      <DataStateResolver
        {...elementProps}
        
        dataObject={{
          ...artifactDto,
          state: !artifactDto?.data ? DataObject.State.PENDING_NO_DATA : DataObject.State.READY,
        }}
        
        nestingLevel="inline"
      >
        {() => (
          <UuTElements.ArtifactLink {...componentProps} {...getProps(artifact, context)}>
            {artifact?.name}
          </UuTElements.ArtifactLink>
        )}
      </DataStateResolver>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { View };
export default View;
//@@viewOff:exports
