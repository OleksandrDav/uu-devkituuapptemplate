//@@viewOn:imports
import { createVisualComponent, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
// import DataTypes from "uu_datatypesg01";

import UuEcc from "uu_editablecomponentcontentg04";

import UuActivity from "uu_activityg01";
import UuArtifact from "uu_artifactg01";

import View from "./detail/view.js";

import Config from "../config/config.js";
//@@viewOff:imports

const InternalHistorizableObjectDetail = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Detail",
  // nestingLevel: View.nestingLevel,
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    // ...View.defaultProps,
  },
  //@@viewOff:defaultProps

  render() {
    //@@viewOn:private
    const { dataObject: artifactDto } = UuArtifact.useArtifact();
    const [route] = useRoute();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <UuActivity.ActivityListProvider>
        {artifactDto.data ? (
          <UuEcc.PageManagement.ProviderWithRts
            oid={artifactDto.data?.data.oid}
            documentOid={artifactDto.data?.data.uuEccData.documentOid}
            pageOid={route.params?.pageOid}
            entityType="historizableObject"
            historyType="none"
            isWithoutByOidSuffix={true}
          >
            <View />
          </UuEcc.PageManagement.ProviderWithRts>
        ) : (
          <Uu5Elements.Pending />
        )}
      </UuActivity.ActivityListProvider>
    );
    //@@viewOff:render
  },
});

// const HistorizableObjectDetail = withRouteParamsProvider(InternalHistorizableObjectDetail, { oid: DataTypes.string });

//@@viewOn:exports
export { InternalHistorizableObjectDetail };
export default InternalHistorizableObjectDetail;
//@@viewOff:exports
