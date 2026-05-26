"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const startServerFunctionsFetcher = require("@tanstack/start-server-functions-fetcher");
function sanitizeBase(base) {
  return base.replace(/^\/|\/$/g, "");
}
const createClientRpc = (functionId, serverBase) => {
  const url = `/${sanitizeBase(serverBase)}/${functionId}`;
  const clientFn = (...args) => {
    return startServerFunctionsFetcher.serverFnFetcher(url, args, fetch);
  };
  return Object.assign(clientFn, {
    url,
    functionId
  });
};
exports.createClientRpc = createClientRpc;
//# sourceMappingURL=index.cjs.map
