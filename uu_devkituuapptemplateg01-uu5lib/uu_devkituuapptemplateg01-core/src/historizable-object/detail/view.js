//@@viewOn:imports
import { createVisualComponent, DynamicLibraryComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";

import UuArtifact from "uu_artifactg01";

import UuEcc from "uu_editablecomponentcontentg04";

import PageTopSection from "../../stub/page-top-section.js";

import Config from "../../config/config.js";

//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

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

  render(props) {
    //@@viewOn:private
    //const viewLsi = useLsi(importLsi, [View.uu5Tag]);

    const { dataObject: artifactDto } = UuArtifact.useArtifact();
    const documentDto = UuEcc.PageManagement.useDocumentContext();
    const document = documentDto?.data || {};
    const pageDto = UuEcc.PageManagement.usePageContext();

    if (pageDto?.handlerMap?.load) {
      const origPageLoad = pageDto.handlerMap.load;
      pageDto.handlerMap.load = () => origPageLoad({ documentOid: artifactDto.data?.data.uuEccData.documentOid });
    }

    const page = document.requestedPage;

    const sidePanelTopSectionContent = page?.sidePanel?.topSection?.content || [];
    const sidePanelSectionList = page?.sidePanel?.sectionList || [];
    const sidePanelBottomSectionContent = page?.sidePanel?.bottomSection?.content || [];

    const mainPanelTopSectionContent = page?.mainPanel?.topSection?.content || [];
    // const mainPanelSectionList = page?.mainPanel?.sectionList || [];
    const mainPanelBottomSectionContent = page?.mainPanel?.bottomSection?.content || [];

    const bottomSectionContent = page?.bottomSection?.content || [];

    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.SpacingProvider type="tight">
        <Uu5Elements.Grid
          className={Config.Css.css({
            padding: Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "d"]),
          })}
          templateAreas={{
            xs: "topSection, sidePanel, mainPanel, bottomSection",
            m: "topSection topSection, sidePanel mainPanel, bottomSection bottomSection",
          }}
          templateColumns={{ xs: "1fr", m: "240px 1fr" }}
          rowGap={Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "c"])}
          columnGap={Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "c"])}
        >
          <Uu5Elements.Grid.Item gridArea="topSection">
            <PageTopSection
              uuAppType="historizableObject"
              schema="historizableObject"
              uuType="uu-devkituuapptemplate-maing01/historizableObject"
              historyType="none"
              useUuAppWorkspace={false}
            />
          </Uu5Elements.Grid.Item>
          <Uu5Elements.Grid.Item gridArea="sidePanel">
            <Uu5Elements.Grid rowGap={Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "c"])}>
              {sidePanelTopSectionContent.length
                ? sidePanelTopSectionContent.map((contentItem, index) => (
                    <DynamicLibraryComponent key={index} {...contentItem} />
                  ))
                : null}
              {sidePanelSectionList.length
                ? sidePanelSectionList.map((section) =>
                    section.content.map((contentItem) => (
                      <DynamicLibraryComponent key={section.oid} {...contentItem} />
                    )),
                  )
                : null}
              {sidePanelBottomSectionContent.length
                ? sidePanelBottomSectionContent.map((contentItem, index) => (
                    <DynamicLibraryComponent key={index} {...contentItem} />
                  ))
                : null}
            </Uu5Elements.Grid>
          </Uu5Elements.Grid.Item>
          <Uu5Elements.Grid.Item gridArea="mainPanel">
            <Uu5Elements.Grid rowGap={Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "c"])}>
              {mainPanelTopSectionContent?.length
                ? mainPanelTopSectionContent.map((contentItem, index) => (
                    <DynamicLibraryComponent key={index} {...contentItem} />
                  ))
                : null}
              <UuEcc.Page {...pageDto} />
              {/* {mainPanelSectionList.length
                ? mainPanelSectionList.map((section) =>
                    section.content.map((contentItem, index) => (
                      <DynamicLibraryComponent key={index} {...contentItem} />
                    )),
                  )
                : null} */}
              {mainPanelBottomSectionContent?.length
                ? mainPanelBottomSectionContent.map((contentItem, index) => (
                    <DynamicLibraryComponent key={index} {...contentItem} />
                  ))
                : null}
            </Uu5Elements.Grid>
          </Uu5Elements.Grid.Item>
          <Uu5Elements.Grid.Item gridArea="bottomSection">
            {bottomSectionContent?.length ? (
              <Uu5Elements.Grid rowGap={Uu5Elements.UuGds.getValue(["SpacingPalette", "fixed", "c"])}>
                {bottomSectionContent.map((contentItem, index) => (
                  <DynamicLibraryComponent key={index} {...contentItem} />
                ))}
              </Uu5Elements.Grid>
            ) : null}
          </Uu5Elements.Grid.Item>
        </Uu5Elements.Grid>
      </Uu5Elements.SpacingProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { View };
export default View;
//@@viewOff:exports
