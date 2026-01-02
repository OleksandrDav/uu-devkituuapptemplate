import { PropTypes } from "uu5g05";

export default class Types {
  static Keys = {
    awid: PropTypes.string,
    id: PropTypes.string,
    oid: PropTypes.string,
    name: PropTypes.string,
    desc: PropTypes.string,
    state: PropTypes.string,
    uuTerritoryBaseUri: PropTypes.string,
    temporaryData: PropTypes.object,
    artifactOid: PropTypes.string,
    uuEccData: PropTypes.exact({
      documentOid: PropTypes.string.isRequired,
      pageOid: PropTypes.string.isRequired,
    }),
    uuEbcData: PropTypes.exact({
      uuBbSystemCollectionSetOid: PropTypes.string.isRequired,
      uuBbAttachmentsCollectionOid: PropTypes.string.isRequired,
    }),
    uuEscData: PropTypes.exact({
      uuBbSystemCollectionSetOid: PropTypes.string.isRequired,
      uuBbMainCollectionOid: PropTypes.string.isRequired,
    }),
    sys: PropTypes.exact({
      cts: PropTypes.string.isRequired,
      mts: PropTypes.string.isRequired,
      rev: PropTypes.number.isRequired,
      uuObjectType: PropTypes.oneOf(["uuDevKitUuAppTemplate"]).isRequired,
      lockHash: PropTypes.string,
      lockExp: PropTypes.string,
      uuIdentity: PropTypes.string,
      trashed: PropTypes.bool,
      spanList: PropTypes.array,
    }),
  };

  static Instance = PropTypes.shape({
    awid: Types.Keys.awid.isRequired,
    id: Types.Keys.id.isRequired,
    oid: Types.Keys.oid.isRequired,
    name: Types.Keys.name.isRequired,
    desc: Types.Keys.desc,
    state: Types.Keys.state.isRequired,
    uuTerritoryBaseUri: Types.Keys.uuTerritoryBaseUri.isRequired,
    temporaryData: Types.Keys.temporaryData,
    artifactOid: Types.Keys.artifactOid.isRequired,
    uuEccData: Types.Keys.uuEccData.isRequired,
    uuEbcData: Types.Keys.uuEbcData.isRequired,
    uuEscData: Types.Keys.uuEscData.isRequired,
    sys: Types.Keys.sys.isRequired,
  });
}
