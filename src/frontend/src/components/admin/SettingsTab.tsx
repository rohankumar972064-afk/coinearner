import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import type { AppSettings, SettingsChangeLog } from "../../backend.d";

type TogglesState = {
  adsEnabled: boolean;
  dailyRewardsEnabled: boolean;
  referralsEnabled: boolean;
  withdrawalsEnabled: boolean;
  tasksEnabled: boolean;
};

type AdvancedState = {
  maxCoinsPerUser: string;
  dailyCoinsGrantCap: string;
  fraudPenaltyCoins: string;
};

const TOGGLE_CONFIG: {
  key: keyof TogglesState;
  label: string;
  desc: string;
  icon: string;
}[] = [
  {
    key: "adsEnabled",
    label: "Ad Watching",
    desc: "Allow users to watch ads and earn coins",
    icon: "📢",
  },
  {
    key: "dailyRewardsEnabled",
    label: "Daily Rewards",
    desc: "Allow users to claim daily streak rewards",
    icon: "📅",
  },
  {
    key: "referralsEnabled",
    label: "Referrals",
    desc: "Allow users to use referral codes",
    icon: "🔗",
  },
  {
    key: "withdrawalsEnabled",
    label: "Withdrawals",
    desc: "Allow users to submit withdrawal requests",
    icon: "💸",
  },
  {
    key: "tasksEnabled",
    label: "Tasks",
    desc: "Allow users to complete tasks for coins",
    icon: "✅",
  },
];

const RATE_FIELDS: { key: keyof AppSettings; label: string; unit?: string }[] =
  [
    { key: "coinsPerAd", label: "Coins Per Ad", unit: "coins" },
    { key: "dailyBaseReward", label: "Daily Base Reward", unit: "coins" },
    { key: "referralBonus", label: "Referral Bonus", unit: "coins" },
    { key: "minWithdrawalRupees", label: "Min Withdrawal", unit: "₹" },
  ];

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      data-ocid={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
        checked ? "bg-green-500" : "bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function SettingsTab() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();
  const [toggles, setToggles] = useState<TogglesState>({
    adsEnabled: true,
    dailyRewardsEnabled: true,
    referralsEnabled: true,
    withdrawalsEnabled: true,
    tasksEnabled: true,
  });
  const [advanced, setAdvanced] = useState<AdvancedState>({
    maxCoinsPerUser: "",
    dailyCoinsGrantCap: "",
    fraudPenaltyCoins: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.adminGetSettings();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: changelog } = useQuery<SettingsChangeLog[]>({
    queryKey: ["admin-settings-log"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.adminGetSettingsChangeLog();
    },
    enabled: !!actor && !isFetching,
  });

  useEffect(() => {
    if (settings) {
      setToggles({
        adsEnabled: settings.adsEnabled,
        dailyRewardsEnabled: settings.dailyRewardsEnabled,
        referralsEnabled: settings.referralsEnabled,
        withdrawalsEnabled: settings.withdrawalsEnabled,
        tasksEnabled: settings.tasksEnabled,
      });
      setAdvanced({
        maxCoinsPerUser: settings.maxCoinsPerUser.toString(),
        dailyCoinsGrantCap: settings.dailyCoinsGrantCap.toString(),
        fraudPenaltyCoins: settings.fraudPenaltyCoins.toString(),
      });
      setHasChanges(false);
    }
  }, [settings]);

  const handleToggle = (key: keyof TogglesState, value: boolean) => {
    setToggles((t) => ({ ...t, [key]: value }));
    setHasChanges(true);
  };

  const handleAdvanced = (key: keyof AdvancedState, value: string) => {
    setAdvanced((a) => ({ ...a, [key]: value }));
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !settings) throw new Error("No actor");
      const next: AppSettings = {
        ...settings,
        ...toggles,
        maxCoinsPerUser: BigInt(advanced.maxCoinsPerUser || 0),
        dailyCoinsGrantCap: BigInt(advanced.dailyCoinsGrantCap || 0),
        fraudPenaltyCoins: BigInt(advanced.fraudPenaltyCoins || 0),
      };
      const result = await actor.adminUpdateSettings(next);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("Settings saved ✓ Changes are live for all users");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["admin-settings-log"] });
      setHasChanges(false);
      setShowConfirm(false);
    },
    onError: (e) =>
      toast.error(`Failed: ${e instanceof Error ? e.message : "Error"}`),
  });

  const lastMod = settings?.lastModified
    ? new Date(Number(settings.lastModified) / 1_000_000).toLocaleString(
        "en-IN",
      )
    : "—";

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((k) => (
          <Skeleton key={k} className="h-20 rounded-xl bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="settings-tab">
      {/* Warning Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-yellow-300">
            Important Notice
          </p>
          <p className="text-xs text-yellow-400/70">
            Changes take effect immediately for all users. Use carefully.
          </p>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h2 className="text-sm font-bold text-gray-200">Feature Toggles</h2>
        <p className="text-xs text-gray-500 mb-5 mt-1">
          Last modified: {lastMod}
        </p>

        <div className="space-y-3">
          {TOGGLE_CONFIG.map(({ key, label, desc, icon }) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl border border-gray-700 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">{icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-200">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-medium ${toggles[key] ? "text-green-400" : "text-red-400"}`}
                >
                  {toggles[key] ? "ON" : "OFF"}
                </span>
                <Toggle
                  checked={toggles[key]}
                  onChange={(v) => handleToggle(key, v)}
                  id={`toggle-${key}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Settings (read-only link to earnings) */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-200">Rate Settings</h2>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            Edit in Earnings Config tab
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RATE_FIELDS.map((f) => (
            <div
              key={String(f.key)}
              className="bg-gray-700/60 rounded-lg p-3 border border-gray-700"
            >
              <p className="text-lg font-bold text-orange-400">
                {settings
                  ? Number(settings[f.key]).toLocaleString("en-IN")
                  : "—"}
                {f.unit && (
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    {f.unit}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h2 className="text-sm font-bold text-gray-200 mb-4">
          Advanced Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(
            [
              {
                key: "maxCoinsPerUser",
                label: "Max Coins Per User",
                desc: "Maximum coin balance allowed per user",
              },
              {
                key: "dailyCoinsGrantCap",
                label: "Daily Coins Grant Cap",
                desc: "Max admin coins grant per day",
              },
              {
                key: "fraudPenaltyCoins",
                label: "Fraud Penalty Coins",
                desc: "Coins deducted on fraud detection",
              },
            ] as { key: keyof AdvancedState; label: string; desc: string }[]
          ).map(({ key, label, desc }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-gray-300 text-sm font-medium">
                {label}
              </Label>
              <p className="text-xs text-gray-500">{desc}</p>
              <Input
                data-ocid={`advanced-${key}`}
                type="number"
                min={0}
                value={advanced[key]}
                onChange={(e) => handleAdvanced(key, e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          data-ocid="save-feature-settings"
          onClick={() => setShowConfirm(true)}
          disabled={!hasChanges || saveMutation.isPending}
          className="bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {hasChanges ? "Save All Changes" : "No Changes"}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowConfirm(false)}
            onKeyDown={(e) => e.key === "Escape" && setShowConfirm(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close dialog"
          />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="font-bold text-gray-100">Confirm Changes</h3>
            </div>
            <p className="text-sm text-gray-400">
              These settings will take effect immediately for all users. Are you
              sure you want to continue?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                data-ocid="confirm-save-settings"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold"
              >
                {saveMutation.isPending ? "Saving…" : "Apply Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Changelog */}
      {changelog && changelog.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            📋 Recent Changes (last 20)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {["Field", "Old Value", "New Value", "Admin", "Time"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs text-gray-500 font-medium uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {changelog.slice(0, 20).map((log) => (
                  <tr
                    key={`${log.field}-${log.timestamp.toString()}`}
                    className="border-b border-gray-800 hover:bg-gray-700/30"
                  >
                    <td className="px-3 py-2 text-orange-400 font-medium text-xs">
                      {log.field}
                    </td>
                    <td className="px-3 py-2 text-red-400 text-xs">
                      {log.oldVal}
                    </td>
                    <td className="px-3 py-2 text-green-400 text-xs">
                      {log.newVal}
                    </td>
                    <td className="px-3 py-2 text-gray-400 font-mono text-xs">
                      {log.adminId.toText().slice(0, 14)}…
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">
                      {new Date(
                        Number(log.timestamp) / 1_000_000,
                      ).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
