import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// BigInt JSON serialization polyfill
BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Allow 2 retries with backoff before surfacing errors
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      // Don't refetch on window focus to avoid cascading errors
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found — check index.html");
}

ReactDOM.createRoot(root).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      {/*
       * InternetIdentityProvider MUST be present for useActor (from
       * @caffeineai/core-infrastructure) to work. Even though this app uses
       * mobile OTP login (not Internet Identity), the provider is required as
       * infrastructure. Without it, useActor throws "InternetIdentityProvider
       * is not present" which causes the "Something went wrong" error.
       */}
      <InternetIdentityProvider>
        <App />
      </InternetIdentityProvider>
    </QueryClientProvider>
  </ErrorBoundary>,
);
