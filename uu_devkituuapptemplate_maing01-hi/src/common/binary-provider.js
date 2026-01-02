//@@viewOn:imports
import { createComponent, PropTypes } from "uu5g05";
import { withBaseUri } from "uu_plus4u5g02";

import Config from "./config.js";
import EntityUtilsFactory from "../utils/entity-utils-factory.js";
import DataObject from "../utils/data-object.js";
//@@viewOff:imports

//@@viewOn:helpers
const EmptyProvider = (props) => props.children;
//@@viewOff:helpers

let InternalBinaryProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + `BinaryProvider`,
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    appType: PropTypes.oneOf(EntityUtilsFactory.createEntityAppTypeList()).isRequired,
    entityDto: DataObject.Types.Instance.isRequired,
    baseUri: PropTypes.string,
    oid: PropTypes.string.isRequired,
    rts: PropTypes.string,
    skipInitialLoad: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    skipInitialLoad: false,
  },
  //@@viewOff:defaultProps

  render({ appType, entityDto, baseUri, oid, rts, skipInitialLoad, children }) {
    //@@viewOn:private
    const EntityUtils = EntityUtilsFactory.createEntityUtils(appType);
    //@@viewOff:private

    //@@viewOn:render
    let Wrapper;
    let wrapperProps;

    if (DataObject.hasData(entityDto)) {
      wrapperProps = {
        baseUri,
        oid,
        uuAppType: EntityUtils.APP_TYPE,
        uuType: EntityUtils.EBC_HISTORY_TYPE,
        historyType: EntityUtils.EBC_HISTORY_TYPE,
        collectionOid: entityDto.data?.data.uuEbcData.uuBbAttachmentsCollectionOid,
        rts,
        skipInitialLoad,
      };
    } else {
      Wrapper = EmptyProvider;
    }

    return <Wrapper {...wrapperProps}>{children}</Wrapper>;
    //@@viewOff:render
  },
});

const BinaryProvider = withBaseUri(InternalBinaryProvider);

//@@viewOn:exports
export { BinaryProvider };
export default BinaryProvider;
//@@viewOff:exports
