import { createRouter } from "@tanstack/react-router";
import { dehydrate as dehydrateQuery, hydrate as hydrateQuery } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./lib/queryClient";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    dehydrate: () => ({ queryClientState: dehydrateQuery(queryClient) }),
    hydrate: ({ queryClientState }) => {
      hydrateQuery(queryClient, queryClientState);
    },
  });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
