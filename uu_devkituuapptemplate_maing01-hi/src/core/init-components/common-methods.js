import { Lsi } from "uu5g05";

import importLsi from "../../lsi/import-lsi.js";

const validateDtoIn = (dtoInInputData, addAlert) => {
  let isValid;
  const dtoIn = typeof dtoInInputData === "string" ? JSON.parse(dtoInInputData) : dtoInInputData;
  if (dtoIn.mode === "retry") {
    if (dtoIn.force && !(typeof dtoIn.force === "boolean")) {
      // TODO - repair LSI for retry mode
      addAlert({
        header: <Lsi import={importLsi} path={["InitAppWorkspace", "missedInitFields"]} />,
        priority: "error",
        durationMs: 3000,
      });
    } else {
      isValid = true;
    }
  } else if (dtoIn.mode === "rollback") {
    if (!dtoIn.mode || !dtoIn?.data.name || !dtoIn?.data.locationId || !dtoIn?.data.uuTerritoryBaseUri) {
      addAlert({
        header: <Lsi import={importLsi} path={["InitAppWorkspace", "missedInitFields"]} />,
        priority: "error",
        durationMs: 3000,
      });
    } else {
      isValid = true;
    }
  } else {
    if (!dtoIn.mode || !dtoIn?.data.name || !dtoIn?.data.locationId || !dtoIn?.data.uuTerritoryBaseUri) {
      addAlert({
        header: <Lsi import={importLsi} path={["InitAppWorkspace", "missedInitFields"]} />,
        priority: "error",
        durationMs: 3000,
      });
    } else {
      isValid = true;
    }
  }

  return { dtoIn, isValid };
};

export { validateDtoIn };
