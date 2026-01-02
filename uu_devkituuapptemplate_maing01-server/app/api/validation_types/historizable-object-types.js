/* eslint-disable */

const historizableObjectCreateDtoInType = shape({
  name: string().isRequired(),
  desc: string(),
});

const historizableObjectCreateFinalizeDtoInType = shape({
  lockSecret: hexa64Code().isRequired(),
});

const historizableObjectCreateFinalizeRollbackDtoInType = shape({
  lockSecret: hexa64Code().isRequired(),
});

const historizableObjectListDtoInType = shape({});

const historizableObjectGetDtoInType = shape({
  oid: id().isRequired(),
});

const historizableObjectLoadDtoInType = shape({
  oid: id().isRequired(),
});

const historizableObjectSetStateDtoInType = shape({
  oid: id().isRequired(),
  state: string().isRequired(),
});

const historizableObjectSetStateClosedDtoInType = shape({
  oid: id().isRequired(),
});

const historizableObjectDeleteDtoInType = shape({
  oid: id().isRequired(),
});
