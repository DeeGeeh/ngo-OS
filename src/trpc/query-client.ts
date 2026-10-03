import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { deserialize, serialize } from "superjson";

import { trpcConfig } from "./config";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: trpcConfig.staleTime },
      dehydrate: {
        serializeData: serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
      hydrate: { deserializeData: deserialize },
    },
  });
}
