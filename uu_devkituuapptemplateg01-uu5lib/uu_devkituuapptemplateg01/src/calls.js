import { Environment } from "uu5g05";
import Uu5ComponentKit from "uu5componentkitg01";

const Calls = {
  call(method, url, dtoIn, clientOptions) {
    return Uu5ComponentKit.Utils.AppClient[method](url, dtoIn, clientOptions);
  },

  getCommandUri(useCase, baseUri = Environment.appBaseUri) {
    return (!baseUri.endsWith("/") ? baseUri + "/" : baseUri) + (useCase.startsWith("/") ? useCase.slice(1) : useCase);
  },

  HistorizableObject: {
    list(baseUri, dtoIn) {
      const commandUri = Calls.getCommandUri("historizableObject/list", baseUri);
      return Calls.call("cmdGet", commandUri, dtoIn);
    },

    create(baseUri, dtoIn) {
      const commandUri = Calls.getCommandUri("historizableObject/create", baseUri);
      return Calls.call("cmdPost", commandUri, dtoIn);
    },
  },
};

export default Calls;
