"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const routerCore = require("@tanstack/router-core");
const reactRouter = require("@tanstack/react-router");
function useServerFn(serverFn) {
  const router = reactRouter.useRouter();
  return async (...args) => {
    try {
      const res = await serverFn(...args);
      if (routerCore.isRedirect(res)) {
        throw res;
      }
      return res;
    } catch (err) {
      if (routerCore.isRedirect(err)) {
        const resolvedRedirect = router.resolveRedirect({
          ...err,
          _fromLocation: router.state.location
        });
        return router.navigate(resolvedRedirect);
      }
      throw err;
    }
  };
}
exports.useServerFn = useServerFn;
//# sourceMappingURL=useServerFn.cjs.map
