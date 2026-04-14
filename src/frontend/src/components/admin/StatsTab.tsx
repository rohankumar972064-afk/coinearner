import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, TrendingUp, Users, Wallet } from "lucide-react";
import { createActor } from "../../backend";
import type { EnhancedAdminStats } from "../../backend.d";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}
      >
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function BarChart({ data }: { data: { date: string; coinsEarned: bigint }[] }) {
  const max = Math.max(...data.map((d) => Number(d.coinsEarned)), 1);
  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {data.map((d, i) => {
        const pct = (Number(d.coinsEarned) / max) * 100;
        return (
          <div
            key={d.date || `bar-${i}`}
            className="flex-1 flex flex-col items-center gap-0.5 group relative"
          >
            <div
              className="w-full bg-orange-500/60 hover:bg-orange-400 rounded-sm transition-all"
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-gray-100 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
              {Number(d.coinsEarned).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: bigint;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (Number(value) / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 font-medium">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatsTab() {
  const { actor, isFetching } = useActor(createActor);

  const { data: stats, isLoading } = useQuery<EnhancedAdminStats>({
    queryKey: ["admin-enhanced-stats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.adminGetEnhancedStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <Skeleton key={k} className="h-28 rounded-xl bg-gray-800" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl bg-gray-800" />
      </div>
    );
  }

  if (!stats) return null;

  const bd = stats.earningsBreakdown;
  const totalBreakdown =
    Number(bd.fromAds) +
    Number(bd.fromDaily) +
    Number(bd.fromReferral) +
    Number(bd.fromTasks) +
    Number(bd.fromAdmin);

  const trend = stats.dailyEarningsTrend.slice(-30);

  return (
    <div className="space-y-6" data-ocid="stats-tab">
      {/* Alert: Pending Withdrawals */}
      {Number(stats.pendingWithdrawalsCount) > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-300">
              {Number(stats.pendingWithdrawalsCount)} Pending Withdrawal
              {Number(stats.pendingWithdrawalsCount) > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-yellow-400/70">
              Requires your attention — switch to Withdrawals tab
            </p>
          </div>
        </div>
      )}

      {/* Top Row Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={Number(stats.totalUsers).toLocaleString("en-IN")}
          icon={Users}
          color="bg-blue-500/80"
        />
        <StatCard
          label="Total Coins Earned"
          value={Number(stats.totalCoinsEarned).toLocaleString("en-IN")}
          sub={`≈ ₹${(Number(stats.totalCoinsEarned) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          color="bg-orange-500/80"
        />
        <StatCard
          label="Total Rupees Paid Out"
          value={`₹${Number(stats.totalRupeesPaidOut).toLocaleString("en-IN")}`}
          icon={Wallet}
          color="bg-green-600/80"
        />
        <StatCard
          label="Active Users This Week"
          value={Number(stats.activeUsersThisWeek).toLocaleString("en-IN")}
          icon={Activity}
          color="bg-purple-500/80"
        />
      </div>

      {/* Ad Performance */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          📢 Ad Performance
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-2xl font-bold text-orange-400">
              {Number(stats.totalAdsWatched).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total Ads Watched</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-400">
              {Number(stats.avgCoinsPerAd).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-gray-400 mt-1">Avg Coins / Ad</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-400">
              {Number(stats.totalUsers) > 0
                ? `${((Number(stats.totalAdsWatched) / Number(stats.totalUsers)) * 100).toFixed(1)}%`
                : "0%"}{" "}
            </p>
            <p className="text-xs text-gray-400 mt-1">Engagement Rate</p>
          </div>
        </div>
      </div>

      {/* 30-day Trend */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          📈 30-Day Earnings Trend
        </h3>
        {trend.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            No trend data available yet
          </p>
        ) : (
          <>
            <BarChart data={trend} />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">{trend[0]?.date}</span>
              <span className="text-xs text-gray-500">
                {trend[trend.length - 1]?.date}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          💰 Earnings Breakdown
        </h3>
        <div className="space-y-3">
          <BreakdownBar
            label="Ads"
            value={bd.fromAds}
            total={totalBreakdown}
            color="bg-orange-500"
          />
          <BreakdownBar
            label="Daily Rewards"
            value={bd.fromDaily}
            total={totalBreakdown}
            color="bg-blue-500"
          />
          <BreakdownBar
            label="Referrals"
            value={bd.fromReferral}
            total={totalBreakdown}
            color="bg-green-500"
          />
          <BreakdownBar
            label="Tasks"
            value={bd.fromTasks}
            total={totalBreakdown}
            color="bg-purple-500"
          />
          <BreakdownBar
            label="Admin Grants"
            value={bd.fromAdmin}
            total={totalBreakdown}
            color="bg-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
