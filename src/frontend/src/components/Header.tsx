import { Skeleton } from "@/components/ui/skeleton";
import { Coins, LogOut, TrendingUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { useUserProfile } from "../hooks/useUserProfile";

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { formattedCoins, formattedRupees, isLoading } = useCoinBalance();
  const { data: profile } = useUserProfile();

  if (!isAuthenticated) return null;

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "?";

  return (
    <header
      className="sticky top-0 z-30 bg-card border-b border-border shadow-sm"
      data-ocid="header"
    >
      <div className="flex items-center justify-between px-4 h-14 max-w-screen-xl mx-auto gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/assets/generated/coinearner-logo-transparent.dim_120x120.png"
            alt="CoinEarner"
            className="w-7 h-7 object-contain"
          />
          <span className="font-display font-bold text-lg text-foreground hidden sm:block">
            Coin<span className="text-primary">Earner</span>
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Balance Display */}
          <div data-ocid="header-balance">
            {isLoading ? (
              <Skeleton className="h-9 w-32 rounded-xl" />
            ) : (
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5">
                <div className="flex items-center gap-1 text-primary">
                  <Coins className="w-4 h-4" />
                  <span className="font-display font-bold text-sm">
                    {formattedCoins}
                  </span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1 text-secondary">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="font-body font-medium text-xs">
                    {formattedRupees}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User avatar initials */}
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0"
            title={profile?.username}
            data-ocid="header-avatar"
          >
            <span className="font-display font-bold text-primary-foreground text-xs">
              {initials}
            </span>
          </div>

          {/* Logout — desktop only */}
          <button
            type="button"
            onClick={logout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth text-xs font-body"
            aria-label="Sign out"
            data-ocid="btn-header-logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
