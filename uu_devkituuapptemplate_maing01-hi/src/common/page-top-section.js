//@@viewOn:imports
import { createVisualComponent, useMemo, useRoute, useRouteParams } from "uu5g05";
import Uu5Elements from "uu5g05-elements";

import UuArtifact from "uu_artifactg01";
import UuArtifactCore from "uu_artifactg01-core";
import UuActivityCore from "uu_activityg01-core";
import Uu5ComponentKitCore from "uu5componentkitg01-core";
import UuEcc from "uu_editablecomponentcontentg04";

import Config from "../config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//uugds-p@@viewOn:helpers
function getActionList() {
  let actionList = [];

  actionList.push({
    component: UuEcc.PageEditButton,
  });

  actionList.push({
    component: ({ key, ...componentProps }) => (
      <UuArtifactCore.SystemInfo key={key} {...componentProps} nestingLevel="spot" />
    ),
    collapsed: true,
  });

  actionList.push({
    component: ({ key, ...componentProps }) => <UuActivityCore.ActivityList key={key} {...componentProps} />,
    collapsed: "duplicated",
  });
  actionList.push({
    divider: true,
    collapsed: true,
  });
  actionList.push({
    divider: true,
    collapsed: true,
  });
  actionList.push({
    divider: true,
    collapsed: true,
  });
  actionList.push({
    icon: "uubmlstencil-uubusinessterritory-uuapp-profile",
    children: "Profiles",
    collapsed: true,
    // onClick: () => actionFactory["profiles"].action(),
  });
  actionList.push({
    icon: "uubmlstencil-uumyterritory-uupermission",
    children: "Access overview",
    collapsed: true,
    // onClick: () => actionFactory["accessOverview"].action(),
  });
  actionList.push({
    icon: "uubmlstencil-uclgoodymat-product",
    children: "Product Info",
    collapsed: true,
    // onClick: () => actionFactory["productInfo"].action(),
  });

  return actionList;
}
//@@viewOff:helpers

const InternalPageTopSection = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PageTopSection",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render() {
    //@@viewOn:private
    // FIXME - component should be able to receive baseUri and oid, so that we can use it outside home route
    // FIXME - but for now, first version is simplified, component is expected to be rendered on route only
    let artifactCtx = UuArtifact.useArtifact();
    const { dataObject: artifactDto, interfaceList, baseUri } = artifactCtx;
    // FIXME - useDocument from uuEcc
    const documentDto = UuEcc.PageManagement.useDocumentContext();
    const pageList = documentDto?.data?.pageList || [];
    const [route] = useRoute();
    const params = route?.params || {};
    let setParams;
    try {
      [, setParams] = useRouteParams();
    } catch (e) {
      // no error, so use empty function
      console.error(e);
      setParams = () => {};
    }

    //@@viewOff:private

    // FIXME solve properly creating of all necessary providers if necessary
    const actionList = useMemo(() => getActionList(), []);

    //@@viewOn:render
    return (
      <Uu5ComponentKitCore.RouteHeader
        dataMap={{ artifact: { dataObject: artifactDto } }}
        actionList={actionList}
        type="tabs"
        itemList={pageList.length > 1 ? pageList.map((page) => ({ label: page.name, code: page.pageOid })) : undefined}
        activeItem={params?.pageOid || pageList[0]?.pageOid}
        onActiveItemChange={(e) => setParams({ ...params, pageOid: e.data.activeItem })}
      >
        <Uu5Elements.InfoItem
          title={artifactDto.data?.data.name}
          // FIXME - this should be implemented in a better way, not just by interface
          subtitle={
            interfaceList?.includes("atc") ? (
              <Uu5Elements.Link href={baseUri}>{"uuDevKitUuAppTemplate"}</Uu5Elements.Link>
            ) : (
              "uuAwsc"
            )
          }
          direction="vertical-reverse"
        />
      </Uu5ComponentKitCore.RouteHeader>
    );
    //@@viewOff:render
  },
});

const PageTopSection = InternalPageTopSection;

//@@viewOn:exports
export { PageTopSection };
export default PageTopSection;
//@@viewOff:exports
