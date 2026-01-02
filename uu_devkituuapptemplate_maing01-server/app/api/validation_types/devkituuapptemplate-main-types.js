/* eslint-disable */

const sysUuAppWorkspaceInitDtoInType = shape({
  mode: oneOf(["standard", "retry", "rollback"]).isRequired(),
  force: boolean(),
  data: shape({}, true),
});

const sysUuAppWorkspaceInitStandardDtoInType = shape({
  uuTerritoryBaseUri: uri(true).isRequired(),
  locationId: id().isRequired(),
  responsibleRoleId: id(),
  name: uu5String(1, 1000).isRequired(),
  desc: uu5String(5000),
  permissionMatrix: array(
    oneOf([string(/^[0+1]{32}$/), string(/^[0+1]{8}\-[0+1]{8}\-[0+1]{8}\-[0+1]{8}$/), integer()]),
    5,
    5
  ),
});

const sysUuAppWorkspaceInitFinalizeDtoInType = shape({
  lockSecret: hexa64Code().isRequired(),
});

const sysUuAppWorkspaceInitFinalizeRollbackDtoInType = shape({
  lockSecret: hexa64Code().isRequired(),
});

const sysUuSubAppInstanceCommenceDtoInType = shape({});

const sysUuAppWorkspaceSetStateClosedDtoInType = shape({
  force: boolean(),
});

const sysUuAppWorkspaceSetStateClosedFinalizeDtoInType = shape({
  lockSecret: hexa64Code().isRequired(),
});

const sysUuAppWorkspaceClearDtoInType = shape({
  data: shape({
    awidInitiatorList: array(uuIdentity(), 1, 5),
  }),
  force: boolean(),
});

const sysUuAppWorkspaceClearFinalizeDtoInType = shape({
  lockSecret: hexa64Code().isRequired(),
});

const sysUuAppWorkspaceLoadDtoInType = shape({});
