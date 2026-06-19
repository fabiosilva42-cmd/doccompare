import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "../../api/router";
import { handleMockProcedure } from "./handlers";

/**
 * tRPC link that returns mock data — no backend or database required.
 */
export const mockLink: TRPCLink<AppRouter> = () => {
  return ({ op }) => {
    return observable((observer) => {
      const path = op.path;

      handleMockProcedure(path, op.input, op.type)
        .then((data) => {
          observer.next({
            result: {
              data,
            },
          });
          observer.complete();
        })
        .catch((err) => {
          observer.error(err as Error);
        });
    });
  };
};
