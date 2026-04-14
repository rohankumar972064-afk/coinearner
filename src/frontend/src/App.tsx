import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { Toaster } from "sonner";
import { AuthGuard } from "./components/AuthGuard";
import { RouteErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const EarnPage = lazy(() => import("./pages/EarnPage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function RootComponent() {
  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      <Toaster position="top-center" richColors />
    </>
  );
}

/**
 * Index route: show login page for unauthenticated users,
 * redirect to /dashboard for authenticated users.
 * Still initializing → show loader.
 */
function IndexRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  // While auth client is initializing, show a full-screen loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-body text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Authenticated → go straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  // Not authenticated (idle or loginError) → show login page
  return <LoginPage />;
}

const rootRoute = createRootRoute({ component: RootComponent });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRedirect,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <RouteErrorBoundary>
      <AuthGuard>
        <Suspense fallback={<PageLoader />}>
          <DashboardPage />
        </Suspense>
      </AuthGuard>
    </RouteErrorBoundary>
  ),
});

const earnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/earn",
  component: () => (
    <RouteErrorBoundary>
      <AuthGuard>
        <Suspense fallback={<PageLoader />}>
          <EarnPage />
        </Suspense>
      </AuthGuard>
    </RouteErrorBoundary>
  ),
});

const referralRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/referral",
  component: () => (
    <RouteErrorBoundary>
      <AuthGuard>
        <Suspense fallback={<PageLoader />}>
          <ReferralPage />
        </Suspense>
      </AuthGuard>
    </RouteErrorBoundary>
  ),
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: () => (
    <RouteErrorBoundary>
      <AuthGuard>
        <Suspense fallback={<PageLoader />}>
          <WalletPage />
        </Suspense>
      </AuthGuard>
    </RouteErrorBoundary>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <RouteErrorBoundary>
      <AuthGuard adminOnly>
        <Suspense fallback={<PageLoader />}>
          <AdminPage />
        </Suspense>
      </AuthGuard>
    </RouteErrorBoundary>
  ),
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: () => (
    <RouteErrorBoundary>
      <AuthGuard>
        <Suspense fallback={<PageLoader />}>
          <LeaderboardPage />
        </Suspense>
      </AuthGuard>
    </RouteErrorBoundary>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  earnRoute,
  referralRoute,
  walletRoute,
  adminRoute,
  leaderboardRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
