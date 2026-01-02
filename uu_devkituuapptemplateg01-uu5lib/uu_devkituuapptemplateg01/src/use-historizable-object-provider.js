//@@viewOn:imports
import { useDataObject, useMemo } from "uu5g05";
import Calls from "calls";
//@@viewOff:imports

function useHistorizableObjectProvider({ baseUri, oid, skipInitialLoad = false }) {
  const canLoad = baseUri && oid ? true : false;

  const historizableObjectDto = useDataObject(
    {
      skipInitialLoad: canLoad ? skipInitialLoad : false,
      handlerMap: {
        load: canLoad ? handleLoad : undefined,
      },
    },
    [baseUri, oid],
  );

  function handleLoad() {
    return Calls.HistorizableObject.load(baseUri, { oid });
  }

  const value = useMemo(() => ({ historizableObjectDto, baseUri, oid }), [historizableObjectDto, baseUri, oid]);

  return value;
}

//@@viewOn:exports
export { useHistorizableObjectProvider };
export default useHistorizableObjectProvider;
//@@viewOff:exports
