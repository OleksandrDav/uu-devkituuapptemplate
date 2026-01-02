//@@viewOn:imports
import { createVisualComponent, useRoute } from "uu5g05";
import Uu5ComponentKitCore from "uu5componentkitg01-core";

import { useHistorizableObjectList } from "uu_devkituuapptemplateg01";
import { useArtifact } from "uu_artifactg01";
import UuArtifactCore from "uu_artifactg01-core";

import HistorizableObjectCreateActionItem from "../common/historizable-object-create-action-item";

import Config from "../../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const View = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "View",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render() {
    //@@viewOn:private
    const { dataObject: artifactDto } = useArtifact();
    const { historizableObjectListDto } = useHistorizableObjectList();
    const [, setRoute] = useRoute();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5ComponentKitCore.ContentContainer
        card="full"
        title="HistorizableObject list"
        subtitle={artifactDto.data?.data?.name}
        nestingLevelList={["inline", "spot", "area"]}
        significance="distinct"
        colorScheme="primary"
        actionList={[
          {
            component: ({ key, ...componentProps }) => (
              <HistorizableObjectCreateActionItem key={key} {...componentProps} />
            ),
            collapsed: "duplicated",
          },
        ]}
      >
        {historizableObjectListDto.data
          ? historizableObjectListDto.data.map((historizableObject) => {
              return (
                <div
                  key={historizableObject.data.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRoute("historizableObjectDetail", { oid: historizableObject.data.id });
                  }}
                >
                  <UuArtifactCore.ArtifactLink
                    baseUri={historizableObject.data.uuTerritoryBaseUri}
                    artifactId={historizableObject.data.artifactId}
                    typeIcon={historizableObject.data.typeIcon}
                    typeName={historizableObject.data.typeName}
                    stateIcon={historizableObject.data.stateIcon}
                    stateName={historizableObject.data.stateName}
                    name={historizableObject.data.name}
                  />
                </div>
              );
            })
          : null}
      </Uu5ComponentKitCore.ContentContainer>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { View };
export default View;
//@@viewOff:exports
