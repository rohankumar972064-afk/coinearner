import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Crown, Medal, Trophy } from "lucide-react";
import { createActor } from "../backend";
import type { LeaderboardResult } from "../backend.d";
import { useAuth } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";
import { formatCoins } from "../types";

type Period = "allTime" | "weekly";

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" />
    );
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3)
    return (
      <Medal className="w-5 h-5 text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.5)]" />
    );
  return null;
}

function RankBadge({ rank }: { rank: number }) {
  const base = "text-xs font-bold font-mono w-8 text-center";
  if (rank === 1)
    return <span className={cn(base, "text-yellow-400")}>#1</span>;
  if (rank === 2) return <span className={cn(base, "text-slate-300")}>#2</span>;
  if (rank === 3) return <span className={cn(base, "text-amber-500")}>#3</span>;
  return <span className={cn(base, "text-muted-foreground")}>#{rank}</span>;
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl">
      <Skeleton className="w-8 h-4 rounded" />
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="w-32 h-3.5 rounded" />
        <Skeleton className="w-20 h-3 rounded" />
      </div>
      <Skeleton className="w-16 h-5 rounded-full" />
    </div>
  );
}

export default function LeaderboardPage() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const { data: profile } = useUserProfile();
  const navigate = useNavigate();

  // Read period from URL search params
  const search = useSearch({ strict: false }) as { period?: string };
  const period: Period = search.period === "weekly" ? "weekly" : "allTime";

  const { data, isLoading } = useQuery<LeaderboardResult | null>({
    queryKey: ["leaderboard", period, sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getTopEarners(period, BigInt(50), sessionToken);
      } catch (err) {
        console.error("[LeaderboardPage] fetch error:", err);
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
  });

  // Safe access — data could be null, entries could be missing
  const entries = data?.entries ?? [];
  const userRank = data?.userRank ?? null;
  const profileId = profile?.id ?? null;
  const isInTop50 =
    profileId !== null && entries.some((e) => e.userId === profileId);

  function handlePeriodChange(val: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("period", val);
    window.history.replaceState({}, "", url.toString());
    navigate({ to: "/leaderboard", search: { period: val } });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm">Top coin earners</p>
        </div>
      </div>

      {/* Period tabs */}
      <Tabs value={period} onValueChange={handlePeriodChange}>
        <TabsList className="w-full" data-ocid="leaderboard-tabs">
          <TabsTrigger
            value="allTime"
            className="flex-1"
            data-ocid="tab-alltime"
          >
            All-Time
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1" data-ocid="tab-weekly">
            This Week
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Leaderboard list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading || actorFetching ? (
          <div className="divide-y divide-border/50">
            {Array.from({ length: 10 }).map((_, i) => (
              // biome-ignore lint: index key ok for skeleton
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 px-6 gap-3"
            data-ocid="leaderboard-empty"
          >
            <Trophy className="w-12 h-12 text-muted-foreground/40" />
            <p className="font-display font-semibold text-foreground">
              No earners yet
            </p>
            <p className="text-muted-foreground text-sm text-center">
              Start earning coins to appear on the leaderboard!
            </p>
          </div>
        ) : (
          <ol
            className="divide-y divide-border/40"
            data-ocid="leaderboard-list"
          >
            {entries.map((entry) => {
              // Guard against missing/malformed entry data
              const rank = Number(entry.rank ?? 0);
              const username = entry.username ?? "Unknown";
              const coinsEarned = entry.coinsEarned ?? BigInt(0);
              const userId = entry.userId ?? "";
              const isCurrentUser = profileId !== null && userId === profileId;
              const avatarChar =
                username.length > 0 ? username.charAt(0).toUpperCase() : "?";

              return (
                <li
                  key={userId || String(rank)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 transition-colors duration-150",
                    rank === 1 && "bg-yellow-500/5",
                    rank === 2 && "bg-slate-400/5",
                    rank === 3 && "bg-amber-600/5",
                    isCurrentUser && "bg-primary/8 ring-1 ring-primary/20",
                  )}
                  data-ocid={`leaderboard-row-${rank}`}
                >
                  {/* Rank */}
                  <RankBadge rank={rank} />

                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0",
                      rank === 1
                        ? "bg-yellow-400/20 text-yellow-400 ring-2 ring-yellow-400/30"
                        : rank === 2
                          ? "bg-slate-400/20 text-slate-300 ring-2 ring-slate-400/30"
                          : rank === 3
                            ? "bg-amber-600/20 text-amber-500 ring-2 ring-amber-600/30"
                            : isCurrentUser
                              ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                              : "bg-muted text-muted-foreground",
                    )}
                  >
                    {avatarChar}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={cn(
                          "font-body font-semibold text-sm truncate",
                          isCurrentUser ? "text-primary" : "text-foreground",
                        )}
                      >
                        {username}
                      </span>
                      {isCurrentUser && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-primary/40 text-primary shrink-0 px-1.5 py-0"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <RankMedal rank={rank} />
                    </div>
                  </div>

                  {/* Coins */}
                  <div className="text-right shrink-0">
                    <span className="font-display font-bold text-sm text-primary">
                      {formatCoins(coinsEarned)}
                    </span>
                    <p className="text-muted-foreground text-[11px]">coins</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Your Rank card — only show when userRank and profile are both available */}
      {userRank !== null && profile !== null && profile !== undefined && (
        <div
          className={cn(
            "rounded-2xl border p-4 flex items-center gap-4",
            isInTop50
              ? "bg-primary/10 border-primary/30"
              : "bg-card border-border",
          )}
          data-ocid="your-rank-card"
        >
          <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-base text-primary ring-2 ring-primary/30 shrink-0">
            {(profile.username ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body font-semibold text-foreground text-sm truncate">
              {profile.username ?? "You"}
            </p>
            {isInTop50 ? (
              <p className="text-primary text-xs font-medium mt-0.5">
                🎉 You are in the top 50!
              </p>
            ) : (
              <p className="text-muted-foreground text-xs mt-0.5">Your rank</p>
            )}
          </div>
          <div className="text-right shrink-0 space-y-0.5">
            <div className="font-display font-bold text-lg text-foreground">
              #{Number(userRank.rank ?? 0)}
            </div>
            <div className="text-primary font-bold text-xs">
              {formatCoins(userRank.coinsEarned ?? BigInt(0))} coins
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
