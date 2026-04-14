import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Coins,
  LayoutDashboard,
  LogOut,
  Share2,
  ShieldCheck,
  Trophy,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/earn", icon: Zap, label: "Earn" },
  { to: "/referral", icon: Share2, label: "Referral" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { location } = useRouterState();

  const handleLogout = () => {
    logout();
    queryClient.clear();
    onClose();
  };

  const isAdmin = profile?.isAdmin ?? false;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto lg:h-full",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        data-ocid="sidebar"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/coinearner-logo-transparent.dim_120x120.png"
              alt="CoinEarner"
              className="w-7 h-7 object-contain"
            />
            <span className="font-display font-bold text-base text-sidebar-foreground">
              Coin<span className="text-sidebar-primary">Earner</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/20 transition-smooth"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {profile && (
          <div className="px-5 py-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-sm">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-sidebar-foreground text-sm truncate">
                  {profile.username}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Coins className="w-3 h-3 text-sidebar-primary" />
                  <span className="text-sidebar-primary font-bold text-xs">
                    {profile.coinBalance.toString()}
                  </span>
                  <span className="text-sidebar-foreground/40 text-xs">
                    coins
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
          data-ocid="sidebar-nav"
        >
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-medium transition-smooth",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/20",
                )}
                data-ocid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-medium transition-smooth",
                location.pathname === "/admin"
                  ? "bg-destructive text-destructive-foreground shadow-md"
                  : "text-destructive/80 hover:text-destructive hover:bg-destructive/10",
              )}
              data-ocid="nav-admin"
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 border-t border-sidebar-border pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-body font-medium text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-smooth"
            data-ocid="btn-logout"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
