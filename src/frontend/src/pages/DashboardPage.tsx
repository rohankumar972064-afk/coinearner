import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Flame,
  Gift,
  ListChecks,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Tv,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import type {
  AnnouncementPublic,
  Transaction,
  WithdrawalRequestPublic,
} from "../backend";
import { AnnouncementUrgency, WithdrawalStatus } from "../backend";
import { useAuth } from "../hooks/useAuth";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { useMobileStatus } from "../hooks/useMobileVerification";
import { useUserProfile } from "../hooks/useUserProfile";
import { COINS_TO_RUPEES, formatCoins, formatRupees } from "../types";

// ── helpers ──────────────────────────────────────────────────────────────────

function timeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function txIcon(method: string) {
  const t = (method ?? "").toLowerCase();
  if (t === "ad") return <Tv className="w-4 h-4" />;
  if (t === "daily") return <Gift className="w-4 h-4" />;
  if (t === "referral") return <Trophy className="w-4 h-4" />;
  if (t === "task") return <ListChecks className="w-4 h-4" />;
  if (t === "withdrawal") return <ArrowUpRight className="w-4 h-4" />;
  return <Coins className="w-4 h-4" />;
}

function formatTxDate(ns: bigint): string {
  try {
    const ms = Number((ns ?? BigInt(0)) / BigInt(1_000_000));
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ms));
  } catch {
    return "";
  }
}

function urgencyStyle(urgency: AnnouncementUrgency) {
  switch (urgency) {
    case AnnouncementUrgency.urgent:
      return {
        wrapper: "border-red-500/50 bg-red-950/40",
        icon: "text-red-400",
        title: "text-red-200",
        text: "text-red-300/80",
        dismiss: "text-red-400 hover:bg-red-900/50 hover:text-red-200",
      };
    case AnnouncementUrgency.warning:
      return {
        wrapper: "border-amber-500/50 bg-amber-950/40",
        icon: "text-amber-400",
        title: "text-amber-200",
        text: "text-amber-300/80",
        dismiss: "text-amber-400 hover:bg-amber-900/50 hover:text-amber-200",
      };
    default:
      return {
        wrapper: "border-blue-500/50 bg-blue-950/40",
        icon: "text-blue-400",
        title: "text-blue-200",
        text: "text-blue-300/80",
        dismiss: "text-blue-400 hover:bg-blue-900/50 hover:text-blue-200",
      };
  }
}

// ── Announcement banners ───────────────────────────────────────────────────────

function AnnouncementBanners({
  actor,
  sessionToken,
}: {
  actor: ReturnType<typeof createActor> | null;
  sessionToken: string | null;
}) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { data: announcements } = useQuery<AnnouncementPublic[]>({
    queryKey: ["activeAnnouncements", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getActiveAnnouncements(sessionToken);
      } catch {
        return [];
      }
    },
    enabled: !!actor,
    refetchInterval: 60_000,
  });

  const visible = (announcements ?? []).filter(
    (a) => !dismissedIds.has(a.id.toString()),
  );

  if (visible.length === 0) return null;

  function dismiss(id: bigint) {
    const key = id.toString();
    setDismissedIds((prev) => new Set([...prev, key]));
    if (actor) {
      actor.dismissAnnouncement(id, sessionToken).catch(() => {
        /* best-effort */
      });
    }
  }

  return (
    <div className="space-y-2" data-ocid="announcement-banners">
      <AnimatePresence initial={false}>
        {visible.map((ann) => {
          const style = urgencyStyle(ann.urgency);
          return (
            <motion.div
              key={ann.id.toString()}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -6,
                scale: 0.97,
                transition: { duration: 0.18 },
              }}
              transition={{ duration: 0.25 }}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${style.wrapper}`}
              data-ocid={`announcement-banner-${ann.id}`}
            >
              <BellRing className={`w-5 h-5 shrink-0 mt-0.5 ${style.icon}`} />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm leading-snug ${style.title}`}
                >
                  {ann.title ?? ""}
                </p>
                <p className={`text-xs mt-0.5 leading-relaxed ${style.text}`}>
                  {ann.message ?? ""}
                </p>
              </div>
              <button
                type="button"
                aria-label="Dismiss announcement"
                onClick={() => dismiss(ann.id)}
                className={`shrink-0 rounded-lg p-1 transition-colors duration-150 mt-0.5 ${style.dismiss}`}
                data-ocid={`announcement-dismiss-${ann.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ── Balance card ──────────────────────────────────────────────────────────────

function BalanceCard({
  coins,
  rupees,
  isLoading,
}: { coins: bigint; rupees: number; isLoading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-secondary p-5 text-primary-foreground shadow-lg"
      data-ocid="balance-card"
    >
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-secondary/30 blur-xl" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-body uppercase tracking-widest opacity-80 mb-1">
            Total Balance
          </p>
          {isLoading ? (
            <Skeleton className="h-10 w-36 bg-white/20 rounded-lg" />
          ) : (
            <motion.p
              key={coins.toString()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display text-4xl font-extrabold tracking-tight leading-none"
            >
              {formatCoins(coins)}{" "}
              <span className="text-xl opacity-80">coins</span>
            </motion.p>
          )}
          {isLoading ? (
            <Skeleton className="h-5 w-24 bg-white/20 rounded mt-2" />
          ) : (
            <p className="mt-2 text-sm font-body opacity-90">
              {formatRupees(rupees)}{" "}
              <span className="text-xs opacity-70">≈ ₹10 per 1000 coins</span>
            </p>
          )}
        </div>
        <motion.div
          animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.08, 1] }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 3.5,
            ease: "easeInOut",
          }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg shrink-0 ml-3"
        >
          <span className="text-3xl select-none">🪙</span>
        </motion.div>
      </div>
      <div className="relative mt-4 flex gap-3">
        <Link to="/wallet" className="flex-1">
          <Button
            size="sm"
            className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-primary-foreground font-display font-semibold backdrop-blur-sm transition-smooth"
            data-ocid="balance-wallet-btn"
          >
            Withdraw
          </Button>
        </Link>
        <Link to="/earn" className="flex-1">
          <Button
            size="sm"
            className="w-full bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-white/30 text-primary-foreground font-display font-semibold backdrop-blur-sm transition-smooth"
            data-ocid="balance-earn-btn"
          >
            Earn More
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Daily streak card ─────────────────────────────────────────────────────────

function DailyStreakCard({
  streakDays,
  canClaim,
  isClaiming,
  onClaim,
}: {
  streakDays: number;
  canClaim: boolean;
  isClaiming: boolean;
  onClaim: () => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
    >
      <Card className="card-elevated" data-ocid="daily-streak-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-sm">
                  Daily Streak
                </p>
                <p className="text-xs text-muted-foreground">
                  Keep the fire burning!
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="font-display font-bold text-primary border-primary/30 bg-primary/5"
            >
              🔥 Day {streakDays}
            </Badge>
          </div>
          <div className="flex gap-1.5 mb-4">
            {days.map((d) => {
              const done = d <= streakDays;
              return (
                <div
                  key={d}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-display font-bold transition-smooth ${
                    done
                      ? "bg-accent/15 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <span className="text-[10px]">D{d}</span>
                </div>
              );
            })}
          </div>
          {canClaim ? (
            <button
              type="button"
              onClick={onClaim}
              disabled={isClaiming}
              className="btn-coin w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              data-ocid="daily-claim-btn"
            >
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Claiming…
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  Claim Daily Reward
                </>
              )}
            </button>
          ) : (
            <div
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/60 text-muted-foreground text-sm font-display"
              data-ocid="daily-claimed"
            >
              <Clock className="w-4 h-4" />
              <span>Next claim in {timeUntilMidnight()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Quick action cards ────────────────────────────────────────────────────────

const quickActions = [
  {
    to: "/earn",
    icon: Tv,
    label: "Watch Ads",
    desc: "Earn coins per video",
    color: "text-secondary",
    bg: "bg-secondary/15",
  },
  {
    to: "/earn",
    icon: Zap,
    label: "Daily Reward",
    desc: "Claim today's bonus",
    color: "text-primary",
    bg: "bg-primary/15",
  },
  {
    to: "/referral",
    icon: Share2,
    label: "Invite Friends",
    desc: "500 coins per referral",
    color: "text-accent",
    bg: "bg-accent/15",
  },
  {
    to: "/wallet",
    icon: Wallet,
    label: "Withdraw",
    desc: "Min ₹50 via UPI/Paytm",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

function QuickActionCards() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <h2 className="font-display font-bold text-foreground text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" /> Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map(({ to, icon: Icon, label, desc, color, bg }) => (
          <Link
            key={label}
            to={to}
            data-ocid={`cta-${label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="card-elevated p-4 flex flex-col gap-3 cursor-pointer h-full">
              <div
                className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-sm">
                  {label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <span
                className={`text-sm py-2 px-4 mt-auto text-center rounded-lg font-display font-bold ${color.replace("text-", "bg-").replace(/\/\d+/, "/10")} border ${color.replace("text-", "border-").replace(/\/\d+/, "/20")}`}
              >
                Go →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function QuickStatCard({
  icon,
  label,
  value,
  delay,
}: { icon: React.ReactNode; label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="card-elevated">
        <CardContent className="p-3 text-center">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
            {icon}
          </div>
          <p className="font-display text-lg font-extrabold text-foreground leading-none">
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 font-body leading-tight">
            {label}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Withdrawal poll toast ─────────────────────────────────────────────────────

function useWithdrawalToasts(
  actor: ReturnType<typeof createActor> | null,
  sessionToken: string | null,
) {
  const seenStatusRef = useRef<Map<string, string>>(new Map());
  const isFirstLoad = useRef(true);

  useQuery<WithdrawalRequestPublic[]>({
    queryKey: ["myWithdrawalsPolled", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const data = await actor.getMyWithdrawals(sessionToken);
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          for (const w of data)
            seenStatusRef.current.set(w.id.toString(), w.status);
          return data;
        }
        for (const w of data) {
          const key = w.id.toString();
          const prev = seenStatusRef.current.get(key);
          if (prev && prev !== w.status) {
            if (w.status === WithdrawalStatus.approved) {
              toast.success(`✅ Withdrawal ₹${w.rupeeAmount} approved!`, {
                description: "Payment will be processed shortly.",
              });
            } else if (w.status === WithdrawalStatus.paid) {
              toast.success(`💸 Withdrawal ₹${w.rupeeAmount} paid!`, {
                description: "Money has been sent to your account.",
              });
            } else if (w.status === WithdrawalStatus.rejected) {
              toast.error(`❌ Withdrawal ₹${w.rupeeAmount} rejected`, {
                description: w.adminNote || "Please contact support.",
              });
            }
          }
          seenStatusRef.current.set(key, w.status);
        }
        return data;
      } catch {
        return [];
      }
    },
    enabled: !!actor,
    refetchInterval: 60_000,
  });
}

// ── Referral bonus toast ──────────────────────────────────────────────────────

function useReferralBonusToast(
  actor: ReturnType<typeof createActor> | null,
  sessionToken: string | null,
) {
  const seenTxRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useQuery<Transaction[]>({
    queryKey: ["txPollReferral", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const { transactions } = await actor.getTransactionHistory(
          BigInt(20),
          BigInt(0),
          sessionToken,
        );
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          for (const tx of transactions)
            seenTxRef.current.add(tx.id.toString());
          return transactions;
        }
        for (const tx of transactions) {
          const key = tx.id.toString();
          if (
            !seenTxRef.current.has(key) &&
            (tx.method ?? "").toLowerCase() === "referral" &&
            tx.isCredit
          ) {
            toast.success(`🎉 Referral bonus! +${tx.amount.toString()} coins`, {
              description: "Someone used your referral code.",
            });
          }
          seenTxRef.current.add(key);
        }
        return transactions;
      } catch {
        return [];
      }
    },
    enabled: !!actor,
    refetchInterval: 60_000,
  });
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { mobileNumber, sessionToken } = useAuth();
  const {
    coins,
    rupees,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useCoinBalance();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const [claimedThisSession, setClaimedThisSession] = useState(false);

  const { data: mobileStatus } = useMobileStatus();

  useWithdrawalToasts(actor, sessionToken);
  useReferralBonusToast(actor, sessionToken);

  const displayName =
    profile?.username ||
    (mobileNumber
      ? `+91 ${mobileNumber.slice(-4).padStart(mobileNumber.length, "*")}`
      : "there");

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["transactionHistory", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const { transactions } = await actor.getTransactionHistory(
          BigInt(5),
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

  const safeTransactions = transactions ?? [];

  const todayCoins = (() => {
    try {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      return safeTransactions
        .filter((t) => {
          const ms = Number((t.createdAt ?? BigInt(0)) / BigInt(1_000_000));
          return ms >= midnight.getTime() && t.isCredit;
        })
        .reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
    } catch {
      return 0;
    }
  })();

  const adsWatched = safeTransactions.filter(
    (t) => (t.method ?? "").toLowerCase() === "ad",
  ).length;

  const hasClaimed = (() => {
    if (claimedThisSession) return true;
    if (safeTransactions.length === 0) return false;
    try {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      return safeTransactions.some((t) => {
        const ms = Number((t.createdAt ?? BigInt(0)) / BigInt(1_000_000));
        return (
          ms >= midnight.getTime() && (t.method ?? "").toLowerCase() === "daily"
        );
      });
    } catch {
      return false;
    }
  })();

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.claimDailyReward(sessionToken);
    },
    onSuccess: (coinsEarned) => {
      setClaimedThisSession(true);
      const streakDay = (profile?.currentStreak ?? 0) + 1;
      toast.success(
        `🎉 Claimed ${coinsEarned.toString()} coins! Streak: Day ${streakDay}`,
        {
          description: "Keep your streak alive — come back tomorrow!",
        },
      );
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
      refetchBalance();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to claim reward");
    },
  });

  return (
    <>
      <div
        className="space-y-5 max-w-lg mx-auto pb-8"
        data-ocid="dashboard-page"
      >
        <AnnouncementBanners actor={actor} sessionToken={sessionToken} />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="pt-1"
        >
          {profileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-52 rounded-lg" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-foreground leading-tight">
                  Namaste, {displayName}! 👋
                </h1>
                <p className="text-muted-foreground text-sm font-body mt-0.5">
                  Ready to earn today?
                </p>
              </div>
              {/* Mobile verified badge */}
              {mobileStatus?.mobileVerified && mobileStatus.mobileNumber ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 shrink-0"
                  title={`Verified: +91 ${mobileStatus.mobileNumber}`}
                  data-ocid="mobile-verified-badge"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-display font-semibold text-accent">
                    Verified
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 shrink-0"
                  data-ocid="verify-mobile-prompt"
                >
                  <Phone className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-display font-medium text-accent">
                    Verified
                  </span>
                </button>
              )}
            </div>
          )}
        </motion.div>

        <BalanceCard coins={coins} rupees={rupees} isLoading={balanceLoading} />

        <DailyStreakCard
          streakDays={profile?.currentStreak ?? 0}
          canClaim={!hasClaimed}
          isClaiming={claimMutation.isPending}
          onClaim={() => claimMutation.mutate()}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="font-display font-bold text-foreground text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Your Stats
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <QuickStatCard
              icon={<Coins className="w-4 h-4" />}
              label="Today's Earnings"
              value={formatCoins(todayCoins)}
              delay={0.18}
            />
            <QuickStatCard
              icon={<Tv className="w-4 h-4" />}
              label="Ads Watched"
              value={String(adsWatched)}
              delay={0.22}
            />
            <QuickStatCard
              icon={<Calendar className="w-4 h-4" />}
              label="Streak Days"
              value={String(profile?.currentStreak ?? 0)}
              delay={0.26}
            />
          </div>
        </motion.div>

        <QuickActionCards />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          data-ocid="recent-activity"
        >
          <h2 className="font-display font-bold text-foreground text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Recent Activity
          </h2>
          <Card className="card-elevated">
            <CardContent className="p-0">
              {txLoading ? (
                <div className="divide-y divide-border">
                  {["s1", "s2", "s3", "s4"].map((sk) => (
                    <div key={sk} className="flex items-center gap-3 px-4 py-3">
                      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-32 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>
                  ))}
                </div>
              ) : safeTransactions.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-10 gap-2 text-center"
                  data-ocid="activity-empty"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Coins className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-display font-semibold text-foreground">
                    No activity yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Start earning to see your history here
                  </p>
                  <Link to="/earn">
                    <Button size="sm" variant="outline" className="mt-2">
                      Start Earning
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {safeTransactions.map((tx, i) => {
                    const isWithdrawal = !tx.isCredit;
                    return (
                      <motion.div
                        key={tx.id.toString()}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3 px-4 py-3"
                        data-ocid={`tx-row-${i}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isWithdrawal ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}
                        >
                          {txIcon(tx.method)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-display font-semibold text-foreground truncate">
                            {tx.note || tx.method || "Transaction"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTxDate(tx.createdAt)}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-display font-bold shrink-0 ${isWithdrawal ? "text-destructive" : "text-accent"}`}
                        >
                          {isWithdrawal ? "-" : "+"}
                          {formatCoins(tx.amount ?? BigInt(0))}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground font-body pb-2">
          {formatRupees(COINS_TO_RUPEES(coins))} •{" "}
          <Link
            to="/wallet"
            className="text-primary font-medium hover:underline"
          >
            Withdraw via UPI / Paytm
          </Link>
        </p>
      </div>
    </>
  );
}
