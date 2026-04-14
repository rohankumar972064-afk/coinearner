import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Flag,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import type { FraudFlagPublic, FraudStats } from "../../backend.d";
import { FraudFlagType, FraudResolution } from "../../backend.d";

const FLAG_BADGE: Record<FraudFlagType, { label: string; cls: string }> = {
  [FraudFlagType.suspiciousAdClicks]: {
    label: "Suspicious Ads",
    cls: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  [FraudFlagType.multipleAccounts]: {
    label: "Multi-Account",
    cls: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  [FraudFlagType.referralLoop]: {
    label: "Referral Loop",
    cls: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  [FraudFlagType.manualFlag]: {
    label: "Manual Flag",
    cls: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
  [FraudFlagType.suspiciousReferral]: {
    label: "Suspicious Referral",
    cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  [FraudFlagType.earlyWithdrawal]: {
    label: "Early Withdrawal",
    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
};

function ManualFlagModal({ onClose }: { onClose: () => void }) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      const principal = Principal.fromText(userId.trim());
      const result = await actor.adminFlagUser(principal, reason);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("User flagged");
      qc.invalidateQueries({ queryKey: ["admin-fraud-flags"] });
      qc.invalidateQueries({ queryKey: ["admin-fraud-stats"] });
      onClose();
    },
    onError: (e) =>
      toast.error(`Failed: ${e instanceof Error ? e.message : "Error"}`),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Manually Flag User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">User Principal</Label>
            <Input
              data-ocid="flag-user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Reason</Label>
            <Textarea
              data-ocid="flag-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you flagging this user?"
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            data-ocid="flag-submit"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={!userId.trim() || !reason.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Flagging…" : "Flag User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResolveModal({
  flag,
  onClose,
}: {
  flag: FraudFlagPublic;
  onClose: () => void;
}) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [resolution, setResolution] = useState<FraudResolution>(
    FraudResolution.markLegitimate,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.adminResolveFraudFlag(
        flag.userId,
        flag.flagType,
        resolution,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("Flag resolved");
      qc.invalidateQueries({ queryKey: ["admin-fraud-flags"] });
      qc.invalidateQueries({ queryKey: ["admin-fraud-stats"] });
      onClose();
    },
    onError: (e) =>
      toast.error(`Failed: ${e instanceof Error ? e.message : "Error"}`),
  });

  const OPTIONS: {
    value: FraudResolution;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: FraudResolution.markLegitimate,
      label: "Mark Legitimate",
      desc: "Activity is genuine — clear the flag",
      icon: <ShieldCheck className="w-4 h-4 text-green-400" />,
    },
    {
      value: FraudResolution.blockUser,
      label: "Block User",
      desc: "Confirmed fraud — block this account",
      icon: <Ban className="w-4 h-4 text-red-400" />,
    },
    {
      value: FraudResolution.dismiss,
      label: "Dismiss",
      desc: "Not enough evidence — dismiss without action",
      icon: <X className="w-4 h-4 text-gray-400" />,
    },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Resolve Flag</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-xs">
            <p className="text-gray-400">{flag.reason}</p>
            {flag.evidence && (
              <p className="text-gray-500 mt-1">{flag.evidence}</p>
            )}
          </div>
          <div className="space-y-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResolution(opt.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  resolution === opt.value
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                {opt.icon}
                <div>
                  <p className="text-sm font-semibold text-gray-200">
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            data-ocid="resolve-confirm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={
              resolution === FraudResolution.blockUser
                ? "bg-red-600 hover:bg-red-700 text-white"
                : resolution === FraudResolution.markLegitimate
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
            }
          >
            {mutation.isPending ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type FlagFilter = "all" | "unresolved" | "resolved";

export function FraudTab() {
  const { actor, isFetching } = useActor(createActor);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [resolveFlag, setResolveFlag] = useState<FraudFlagPublic | null>(null);
  const [flagFilter, setFlagFilter] = useState<FlagFilter>("all");

  const { data: allFlags, isLoading: flagsLoading } = useQuery<
    FraudFlagPublic[]
  >({
    queryKey: ["admin-fraud-flags"],
    queryFn: async () => (actor ? actor.adminGetFraudFlags(false) : []),
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery<FraudStats>({
    queryKey: ["admin-fraud-stats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.adminGetFraudStats();
    },
    enabled: !!actor && !isFetching,
  });

  const flags = (allFlags ?? []).filter((f) => {
    if (flagFilter === "unresolved") return !f.isResolved;
    if (flagFilter === "resolved") return f.isResolved;
    return true;
  });

  const FILTER_OPTIONS: { id: FlagFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unresolved", label: "Unresolved" },
    { id: "resolved", label: "Resolved" },
  ];

  return (
    <div className="space-y-6" data-ocid="fraud-tab">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-xs text-gray-400">Total Flagged</p>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {Number(stats?.totalFlagged ?? 0)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-gray-400">Unresolved</p>
          </div>
          <p className="text-2xl font-bold text-yellow-400">
            {Number(stats?.unresolvedFlags ?? 0)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4 text-orange-400" />
            <p className="text-xs text-gray-400">Most Common</p>
          </div>
          <p className="text-sm font-bold text-orange-400 truncate">
            {stats?.mostCommonFlagType || "—"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <p className="text-xs text-gray-400">Resolved</p>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {Number(stats?.resolvedFlags ?? 0)}
          </p>
        </div>
      </div>

      {/* Filter + Actions Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              data-ocid={`fraud-filter-${opt.id}`}
              onClick={() => setFlagFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                flagFilter === opt.id
                  ? "bg-orange-500 border-orange-500 text-gray-950"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button
          data-ocid="manual-flag-btn"
          size="sm"
          onClick={() => setShowFlagModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold text-xs"
        >
          <Flag className="w-3.5 h-3.5 mr-1" />
          Manual Flag
        </Button>
      </div>

      {/* Flags Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              {[
                "User",
                "Flag Type",
                "Evidence",
                "Flagged At",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider text-left
                    ${["Evidence", "Flagged At"].includes(h) ? "hidden md:table-cell" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flagsLoading ? (
              [1, 2, 3].map((k) => (
                <tr key={k} className="border-b border-gray-800">
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-5 rounded bg-gray-800" />
                  </td>
                </tr>
              ))
            ) : flags.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12"
                  data-ocid="fraud-empty"
                >
                  <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No fraud flags detected
                  </p>
                </td>
              </tr>
            ) : (
              flags
                .sort((a, b) => Number(b.flaggedAt - a.flaggedAt))
                .map((flag, i) => {
                  const badge =
                    FLAG_BADGE[flag.flagType] ??
                    FLAG_BADGE[FraudFlagType.manualFlag];
                  return (
                    <tr
                      key={`${flag.userId.toText()}-${flag.flagType}`}
                      data-ocid={`fraud-row-${i}`}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[120px]">
                        <span className="truncate block">
                          {flag.userId.toText().slice(0, 16)}…
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs max-w-[200px]">
                        <span className="truncate block">
                          {flag.evidence || flag.reason || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                        {new Date(
                          Number(flag.flaggedAt) / 1_000_000,
                        ).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        {flag.isResolved ? (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            Resolved
                          </span>
                        ) : (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {!flag.isResolved && (
                            <Button
                              data-ocid={`resolve-flag-${i}`}
                              size="sm"
                              onClick={() => setResolveFlag(flag)}
                              className="bg-orange-500 hover:bg-orange-600 text-gray-950 text-xs h-7 px-2 font-bold"
                            >
                              Resolve
                            </Button>
                          )}
                          {flag.resolution && (
                            <span className="text-xs text-gray-500 italic">
                              {flag.resolution}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      {showFlagModal && (
        <ManualFlagModal onClose={() => setShowFlagModal(false)} />
      )}
      {resolveFlag && (
        <ResolveModal flag={resolveFlag} onClose={() => setResolveFlag(null)} />
      )}
    </div>
  );
}
