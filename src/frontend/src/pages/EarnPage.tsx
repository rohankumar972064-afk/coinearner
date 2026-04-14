import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Coins,
  Gift,
  Loader2,
  Play,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { AppSettings, Task, TaskCompletion } from "../backend.d";
import { useAuth } from "../hooks/useAuth";
import { formatCoins } from "../types";

const AD_DURATION_SECS = 30;

// ── Settings hook ─────────────────────────────────────────────────────────────

function useSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AppSettings | null>({
    queryKey: ["appSettings"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getSettings();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

// ── Ad countdown ring ─────────────────────────────────────────────────────────

function AdCountdownRing({ progress }: { progress: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const strokeDash = circ - (progress / 100) * circ;
  return (
    <svg
      width="64"
      height="64"
      className="-rotate-90"
      aria-label="Ad countdown progress"
      role="img"
    >
      <circle
        cx="32"
        cy="32"
        r={r}
        strokeWidth="5"
        className="stroke-muted fill-none"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        strokeWidth="5"
        className="fill-none stroke-primary transition-all duration-300"
        strokeDasharray={circ}
        strokeDashoffset={strokeDash}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Watch Ad card ─────────────────────────────────────────────────────────────

function WatchAdCard({
  settings,
}: { settings: AppSettings | null | undefined }) {
  const { actor, isFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();

  const [watching, setWatching] = useState(false);
  const [secsLeft, setSecsLeft] = useState(AD_DURATION_SECS);
  const [adsToday, setAdsToday] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxDailyAds = settings ? Number(settings.maxDailyAdWatches) : 10;
  const coinsPerAd = settings ? Number(settings.coinsPerAd) : 5;
  const adsEnabled = settings ? settings.adsEnabled : true;

  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const stored = sessionStorage.getItem("ce_ads_date");
      const storedCount = sessionStorage.getItem("ce_ads_count");
      if (stored === today && storedCount) {
        setAdsToday(Number.parseInt(storedCount, 10));
      } else {
        sessionStorage.setItem("ce_ads_date", today);
        sessionStorage.setItem("ce_ads_count", "0");
      }
    } catch {
      // sessionStorage unavailable — proceed with default 0
    }
  }, []);

  const finishAd = async () => {
    if (!actor) return;
    try {
      const coins = await actor.watchAd(sessionToken);
      const newCount = adsToday + 1;
      setAdsToday(newCount);
      try {
        sessionStorage.setItem("ce_ads_count", String(newCount));
      } catch {
        /* ignore */
      }
      toast.success(`🎬 Ad complete! +${coins.toString()} coins earned`, {
        duration: 4500,
      });
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
    } catch {
      toast.error("Could not record ad. Please try again.");
    }
  };

  const handleWatchAd = () => {
    if (watching || adsToday >= maxDailyAds || !actor) return;
    setWatching(true);
    setSecsLeft(AD_DURATION_SECS);
    let remaining = AD_DURATION_SECS;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecsLeft(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setWatching(false);
        finishAd();
      }
    }, 1000);
  };

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  const limitReached = adsToday >= maxDailyAds;
  const progress = ((AD_DURATION_SECS - secsLeft) / AD_DURATION_SECS) * 100;
  const pct = maxDailyAds > 0 ? (adsToday / maxDailyAds) * 100 : 0;

  if (!adsEnabled) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4"
        data-ocid="ads-paused"
      >
        <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground font-body">
          Ads are currently paused. Check back later.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card
        className="overflow-hidden border-primary/20 shadow-md"
        data-ocid="watch-ads-card"
      >
        <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-secondary" />
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 relative flex items-center justify-center w-16 h-16">
              {watching ? (
                <>
                  <AdCountdownRing progress={progress} />
                  <span className="absolute font-display font-black text-base text-primary tabular-nums">
                    {secsLeft}
                  </span>
                </>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <Video className="w-7 h-7 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-black text-base text-foreground">
                Watch Video Ads
              </h3>
              <p className="text-muted-foreground font-body text-xs mt-0.5">
                Earn{" "}
                <span className="text-primary font-bold">
                  {coinsPerAd} coins
                </span>{" "}
                per video
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1">
                  <Progress
                    value={pct}
                    className={`h-1.5 ${limitReached ? "opacity-50" : ""}`}
                  />
                </div>
                <span
                  className={`text-xs font-display font-bold tabular-nums shrink-0 ${limitReached ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {adsToday}/{maxDailyAds}
                </span>
              </div>
            </div>
          </div>
          <Button
            className="w-full mt-4 font-display font-bold h-11 text-sm gap-2"
            variant={limitReached ? "outline" : "default"}
            onClick={handleWatchAd}
            disabled={watching || limitReached || !actor || isFetching}
            data-ocid="btn-watch-ad"
          >
            {watching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Watching… {secsLeft}s remaining
              </>
            ) : limitReached ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Daily limit reached
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Daily reward section ──────────────────────────────────────────────────────

function DailyRewardSection({
  settings,
}: { settings: AppSettings | null | undefined }) {
  const { actor } = useActor(createActor);
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();

  const dailyEnabled = settings ? settings.dailyRewardsEnabled : true;
  const baseReward = settings ? Number(settings.dailyBaseReward) : 10;

  const { data: transactions } = useQuery({
    queryKey: ["transactionHistory", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const { transactions } = await actor.getTransactionHistory(
          BigInt(20),
          BigInt(0),
          sessionToken,
        );
        return transactions;
      } catch {
        return [];
      }
    },
    enabled: !!actor,
  });

  const [claimedSession, setClaimedSession] = useState(false);

  const hasClaimed =
    claimedSession ||
    (() => {
      if (!transactions) return false;
      try {
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        return (transactions ?? []).some((t) => {
          const ms = Number((t.createdAt ?? BigInt(0)) / BigInt(1_000_000));
          return (
            ms >= midnight.getTime() &&
            (t.method ?? "").toLowerCase() === "daily"
          );
        });
      } catch {
        return false;
      }
    })();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.claimDailyReward(sessionToken);
    },
    onSuccess: (coins) => {
      setClaimedSession(true);
      toast.success(`🎉 Daily reward claimed! +${coins.toString()} coins`, {
        description: "Keep your streak alive — come back tomorrow!",
      });
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to claim"),
  });

  if (!dailyEnabled) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4"
        data-ocid="daily-rewards-paused"
      >
        <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground font-body">
          Daily rewards are currently paused.
        </p>
      </div>
    );
  }

  const timeLeft = (() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  })();

  return (
    <Card className="card-elevated" data-ocid="daily-reward-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <Gift className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-sm">
              Daily Reward
            </h3>
            <p className="text-xs text-muted-foreground">
              +{baseReward} base coins every day
            </p>
          </div>
          <Badge
            variant="outline"
            className="ml-auto font-display font-bold text-accent border-accent/30 bg-accent/5"
          >
            {baseReward} coins
          </Badge>
        </div>
        {hasClaimed ? (
          <div
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/60 text-muted-foreground text-sm font-display"
            data-ocid="daily-claimed"
          >
            <Clock className="w-4 h-4" />
            <span>Next claim in {timeLeft}</span>
          </div>
        ) : (
          <Button
            className="w-full font-display font-bold gap-2"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !actor}
            data-ocid="daily-claim-btn"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Claiming…
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                Claim Daily Reward
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Task list ─────────────────────────────────────────────────────────────────

function TaskList() {
  const { actor, isFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listTasks();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const { data: completions = [], isLoading: completionsLoading } = useQuery<
    TaskCompletion[]
  >({
    queryKey: ["completedTasks", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMyCompletedTasks(sessionToken);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const completedIds = new Set(
    (completions ?? []).map((c) => c.taskId.toString()),
  );

  const taskMutation = useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.completeTask(taskId, sessionToken);
    },
    onSuccess: (coins, taskId) => {
      toast.success(`✅ Task complete! +${coins.toString()} coins`, {
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["completedTasks"] });
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.setQueryData<TaskCompletion[]>(
        ["completedTasks"],
        (old = []) => [
          ...old,
          {
            taskId,
            userId: null as unknown as TaskCompletion["userId"],
            completedAt: BigInt(Date.now()),
          },
        ],
      );
    },
    onError: (e: Error) => toast.error(e.message || "Task failed. Try again."),
  });

  const activeTasks = (tasks ?? []).filter((t) => t.isActive);

  if (tasksLoading || completionsLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (activeTasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-10 text-center bg-muted/30 rounded-2xl border border-dashed border-border"
        data-ocid="empty-tasks"
      >
        <ClipboardList className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="font-display font-semibold text-foreground text-sm">
          No tasks yet
        </p>
        <p className="text-muted-foreground font-body text-xs mt-1">
          New tasks will appear here soon
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeTasks.map((task, i) => {
        const done = completedIds.has(task.id.toString());
        const isPending =
          taskMutation.isPending &&
          taskMutation.variables?.toString() === task.id.toString();
        return (
          <motion.div
            key={task.id.toString()}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
          >
            <Card
              className={`transition-all duration-200 shadow-sm ${done ? "bg-muted/40 border-border opacity-80" : "bg-card border-border hover:shadow-md"}`}
              data-ocid={`task-card-${task.id.toString()}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-accent/20" : "bg-primary/10"}`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    ) : (
                      <Coins className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-display font-bold text-sm leading-tight ${done ? "line-through text-muted-foreground" : "text-foreground"}`}
                    >
                      {task.title ?? ""}
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5 truncate">
                      {task.description ?? ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className="font-display font-black text-xs text-primary border-primary/40 bg-primary/5 px-2"
                    >
                      +{formatCoins(task.coinReward ?? BigInt(0))}
                    </Badge>
                    {done ? (
                      <span className="text-xs text-accent font-display font-semibold">
                        Done ✓
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs font-display font-bold"
                        onClick={() => taskMutation.mutate(task.id)}
                        disabled={isPending || !actor || isFetching}
                        data-ocid={`btn-complete-task-${task.id.toString()}`}
                      >
                        {isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Complete"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EarnPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();

  return (
    <div className="space-y-6 pb-6" data-ocid="earn-page">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display font-black text-2xl text-foreground tracking-tight">
          Earn Coins
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-0.5">
          Watch ads &amp; complete tasks to grow your balance
        </p>
      </motion.div>

      <section>
        <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
          📺 Watch Ads
        </h2>
        {settingsLoading ? (
          <Skeleton className="h-36 w-full rounded-xl" />
        ) : (
          <WatchAdCard settings={settings} />
        )}
      </section>

      <section>
        <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
          🔥 Daily Reward
        </h2>
        {settingsLoading ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : (
          <DailyRewardSection settings={settings} />
        )}
      </section>

      <section>
        <h2 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
          📋 Tasks
        </h2>
        <TaskList />
      </section>
    </div>
  );
}
