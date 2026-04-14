import { Button } from "@/components/ui/button";
import { Navigate } from "@tanstack/react-router";
import { RefreshCw, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";

interface AuthGuardProps {
  children: ReactNode;
  adminOnly?: boolean;
}

function ConnectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <WifiOff className="w-7 h-7 text-destructive" />
        </div>
        <div>
          <p className="font-display font-bold text-foreground text-base mb-1">
            Connection Failed
          </p>
          <p className="font-body text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onRetry}
            variant="default"
            className="gap-2 font-display font-semibold"
            data-ocid="authguard-retry-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="gap-2 font-display font-semibold"
            data-ocid="authguard-reload-btn"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground font-body text-sm">{label}</p>
      </div>
    </div>
  );
}

export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const {
    isAuthenticated,
    isLoading: authLoading,
    actorError,
    retryConnection,
  } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  // If actor connection failed, show error with Retry + Refresh options
  if (actorError) {
    return <ConnectionError message={actorError} onRetry={retryConnection} />;
  }

  // While checking localStorage session
  if (authLoading) {
    return <LoadingScreen label="Loading..." />;
  }

  // No session token → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // For admin-only routes: wait until profile is fetched, then check isAdmin
  if (adminOnly) {
    if (profileLoading) {
      return <LoadingScreen label="Verifying access..." />;
    }
    const isAdmin =
      profile !== null && profile !== undefined && profile.isAdmin === true;
    if (!isAdmin) {
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
}
