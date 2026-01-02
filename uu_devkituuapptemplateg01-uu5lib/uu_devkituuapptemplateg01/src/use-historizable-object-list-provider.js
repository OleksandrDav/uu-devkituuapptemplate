//@@viewOn:imports
import { useDataList, useMemo } from "uu5g05";
import { useArtifact } from "uu_artifactg01";

import Calls from "./calls";
//@@viewOff:imports

function useHistorizableObjectListProvider() {
  const { baseUri } = useArtifact();
  // FIXME - how to properly fill in provider / what to properly return in load?
  const historizableObjectListDto = useDataList(
    {
      handlerMap: {
        load: baseUri ? handleLoad : undefined,
        create: handleCreate,
      },
    },
    [baseUri],
  );

  async function handleLoad() {
    // FIXME - temp wait to show loading state
    // await timeout(3000);

    // FIXME - when uuTerritory command can work with oid
    const listActivitiesDto = await Calls.HistorizableObject.list(baseUri, {});

    // FIXME - cmd returns historizableObjectList instead of standard itemList
    return listActivitiesDto;
  }

  async function handleCreate(dtoIn) {
    const callDto = await Calls.HistorizableObject.create(baseUri, dtoIn);
    return callDto.data;
  }

  const value = useMemo(() => ({ historizableObjectListDto }), [historizableObjectListDto]);

  return value;
}

//@@viewOn:exports
export { useHistorizableObjectListProvider };
export default useHistorizableObjectListProvider;
//@@viewOff:exports
