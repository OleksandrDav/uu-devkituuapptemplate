//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";
import { withBaseUri } from "uu_plus4u5g02";
import { PageManagement } from "uu_editablecomponentcontentg04";
import DataObject from "../utils/data-object";
import EntityUtilsFactory from "../utils/entity-utils-factory.js";
import Config from "./config.js";
//@@viewOff:imports

//@@viewOn:helpers

const EmptyProvider = (props) => props.children;

const ProviderWithRts = ({ children, ...propsToPass }) => (
  <PageManagement.ProviderWithRts {...propsToPass}>{children}</PageManagement.ProviderWithRts>
);
//@@viewOff:helpers

let InternalPageProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + `PageProvider`,
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    appType: PropTypes.oneOf(EntityUtilsFactory.createEntityAppTypeList()).isRequired,
    entityDto: DataObject.Types.Instance.isRequired,
    baseUri: PropTypes.string,
    oid: PropTypes.string.isRequired,
    skipInitialLoad: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    skipInitialLoad: false,
  },
  //@@viewOff:defaultProps

  render({ appType, entityDto, baseUri, oid, skipInitialLoad, children }) {
    //@@viewOn:private
    const EntityUtils = EntityUtilsFactory.createEntityUtils(appType);
    //@@viewOff:private

    //@@viewOn:render
    let Provider;
    let providerProps;

    if (!DataObject.hasData(entityDto)) {
      Provider = EmptyProvider;
    } else {
      Provider = ProviderWithRts;
      providerProps = {
        baseUri,
        documentOid: entityDto.data.data.uuEccData.documentOid,
        oid,
        uuAppType: EntityUtils.APP_TYPE,
        uuEccHistoryType: EntityUtils.ECC_HISTORY_TYPE,
        skipInitialLoad,
      };
    }

    return <Provider {...providerProps}>{children}</Provider>;
    //@@viewOff:render
  },
});

const PageProvider = withBaseUri(InternalPageProvider);

//@@viewOn:exports
export { PageProvider };
export default PageProvider;
//@@viewOff:exports
