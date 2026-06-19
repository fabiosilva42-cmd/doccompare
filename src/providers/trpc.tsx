import { createTRPCReact } from "@trpc/react-query";
import { httpLink, splitLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";
import { mockLink } from "@/mock/mockLink";
import { isMockMode } from "@/mock/handlers";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();

const httpTrpcLink = httpLink({
  url: "/api/trpc",
  transformer: superjson,
  headers() {
    const token = localStorage.getItem("doccompare_token");
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },
  fetch(input, init) {
    return globalThis.fetch(input, {
      ...(init ?? {}),
      credentials: "include",
    });
  },
});

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: () => isMockMode(),
      true: mockLink,
      false: httpTrpcLink,
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
