import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import type { AppSettings, SettingsChangeLog } from "../../backend.d";

type SettingsForm = {
  coinsPerAd: string;
  dailyBaseReward: string;
  streakMultiplier: string;
  streakCap: string;
  referralBonus: string;
  minWithdrawalRupees: string;
  maxDailyAdWatches: string;
};

const FIELDS: { key: keyof SettingsForm; label: string; desc: string }[] = [
  {
    key: "coinsPerAd",
    label: "Coins Per Ad",
    desc: "Coins awarded for each ad watched",
  },
  {
    key: "dailyBaseReward",
    label: "Daily Base Reward",
    desc: "Base coins for daily claim",
  },
  {
    key: "streakMultiplier",
    label: "Streak Multiplier",
    desc: "Extra coins added per streak day",
  },
  {
    key: "streakCap",
    label: "Streak Cap",
    desc: "Max additional coins from streak",
  },
  {
    key: "referralBonus",
    label: "Referral Bonus",
    desc: "Coins for both referrer and referee",
  },
  {
    key: "minWithdrawalRupees",
    label: "Min Withdrawal (₹)",
    desc: "Minimum ₹ to withdraw",
  },
  {
    key: "maxDailyAdWatches",
    label: "Max Daily Ad Watches",
    desc: "Ad watch limit per user per day",
  },
];

export function EarningsControlTab() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();
  const [form, setForm] = useState<SettingsForm>({
    coinsPerAd: "",
    dailyBaseReward: "",
    streakMultiplier: "",
    streakCap: "",
    referralBonus: "",
    minWithdrawalRupees: "",
    maxDailyAdWatches: "",
  });
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
      setForm({
        coinsPerAd: settings.coinsPerAd.toString(),
        dailyBaseReward: settings.dailyBaseReward.toString(),
        streakMultiplier: settings.streakMultiplier.toString(),
        streakCap: settings.streakCap.toString(),
        referralBonus: settings.referralBonus.toString(),
        minWithdrawalRupees: settings.minWithdrawalRupees.toString(),
        maxDailyAdWatches: settings.maxDailyAdWatches.toString(),
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !settings) throw new Error("No actor");
      const next: AppSettings = {
        ...settings,
        coinsPerAd: BigInt(form.coinsPerAd || 0),
        dailyBaseReward: BigInt(form.dailyBaseReward || 0),
        streakMultiplier: BigInt(form.streakMultiplier || 0),
        streakCap: BigInt(form.streakCap || 0),
        referralBonus: BigInt(form.referralBonus || 0),
        minWithdrawalRupees: BigInt(form.minWithdrawalRupees || 0),
        maxDailyAdWatches: BigInt(form.maxDailyAdWatches || 0),
      };
      const result = await actor.adminUpdateSettings(next);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("Settings saved ✓");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["admin-settings-log"] });
    },
    onError: (e) =>
      toast.error(
        `Failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      ),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((k) => (
          <Skeleton key={k} className="h-16 rounded-xl bg-gray-800" />
        ))}
      </div>
    );
  }

  const lastMod = settings?.lastModified
    ? new Date(Number(settings.lastModified) / 1_000_000).toLocaleString(
        "en-IN",
      )
    : "—";

  return (
    <div className="space-y-6" data-ocid="earnings-control-tab">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-base font-bold text-gray-200 mb-1">
          Reward Configuration
        </h2>
        <p className="text-xs text-gray-500 mb-6">Last modified: {lastMod}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FIELDS.map(({ key, label, desc }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-gray-300 text-sm font-medium">
                {label}
              </Label>
              <p className="text-xs text-gray-500">{desc}</p>
              <Input
                data-ocid={`settings-${key}`}
                type="number"
                min={0}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
          <Button
            data-ocid="save-settings"
            onClick={() => setShowConfirm(true)}
            disabled={saveMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Confirmation dialog */}
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
              These changes will apply to all NEW earnings from now on.
              Continue?
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
                data-ocid="confirm-save-earnings"
                onClick={() => {
                  setShowConfirm(false);
                  saveMutation.mutate();
                }}
                className="bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold"
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Log */}
      {changelog && changelog.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            📋 Change Log
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
                {changelog.slice(0, 20).map((log, _i) => (
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
