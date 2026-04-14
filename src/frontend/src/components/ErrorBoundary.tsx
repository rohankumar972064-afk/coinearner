import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional fallback — renders instead of children when an error is caught */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log for debugging but never surface raw error to users
    console.error(
      "[CoinEarner] Unhandled render error:",
      error.message,
      info.componentStack,
    );
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center"
          data-ocid="error-boundary-screen"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
            <WifiOff className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display font-black text-2xl text-foreground mb-2">
            App Load Nahi Hua
          </h1>
          <p className="font-body text-sm text-muted-foreground max-w-xs mb-1">
            Something went wrong while loading the page.
          </p>
          <p className="font-body text-xs text-muted-foreground/60 max-w-xs mb-8">
            Please refresh the page. If the problem persists, try clearing your
            browser cache.
          </p>
          <Button
            onClick={this.handleReload}
            className="font-display font-bold gap-2"
            data-ocid="error-boundary-reload-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page / Dobara Try Karein
          </Button>
          <p className="mt-8 text-xs text-muted-foreground/50 font-body">
            CoinEarner — Kamao, Jeeto, Nikaalo 🇮🇳
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Lightweight inline error boundary for per-route use */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[CoinEarner] Route error:",
      error.message,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <WifiOff className="w-6 h-6 text-destructive" />
          </div>
          <p className="font-display font-semibold text-foreground">
            Page load failed
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            This page could not be loaded. Please refresh and try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2 font-display font-semibold"
            data-ocid="route-error-reload-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
