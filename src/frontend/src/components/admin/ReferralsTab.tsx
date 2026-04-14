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
import { AlertCircle, GitBranch, Search, X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import type {
  ReferralRelationshipPublic,
  UserProfilePublic,
} from "../../backend.d";
import { ReferralStatus } from "../../backend.d";

const STATUS_BADGE: Record<ReferralStatus, { label: string; cls: string }> = {
  [ReferralStatus.active]: {
    label: "Active",
    cls: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  [ReferralStatus.revoked]: {
    label: "Revoked",
    cls: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  [ReferralStatus.flagged]: {
    label: "Flagged",
    cls: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
};

function RevokeModal({
  referral,
  onClose,
}: {
  referral: ReferralRelationshipPublic;
  onClose: () => void;
}) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [deductBonus, setDeductBonus] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.adminRevokeReferral(
        referral.referrerId,
        referral.refereeId,
        reason,
        deductBonus,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("Referral revoked");
      qc.invalidateQueries({ queryKey: ["admin-referrals"] });
      onClose();
    },
    onError: (e) =>
      toast.error(`Failed: ${e instanceof Error ? e.message : "Error"}`),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Revoke Referral</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Reason (required)</Label>
            <Textarea
              data-ocid="revoke-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why revoke this referral?"
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
              rows={3}
            />
          </div>
          <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={deductBonus}
              onChange={(e) => setDeductBonus(e.target.checked)}
              className="accent-orange-500"
              data-ocid="deduct-bonus-check"
            />
            <div>
              <p className="text-sm font-medium text-gray-200">
                Deduct Bonus Coins
              </p>
              <p className="text-xs text-gray-400">
                Rollback the{" "}
                {Number(referral.bonusGiven).toLocaleString("en-IN")} coins
                bonus
              </p>
            </div>
          </label>
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
            data-ocid="revoke-submit"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={!reason.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Revoking…" : "Revoke"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChainModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { actor, isFetching } = useActor(createActor);

  const { data: chain, isLoading } = useQuery<{
    referred: UserProfilePublic[];
    referredBy?: UserProfilePublic;
  }>({
    queryKey: ["referral-chain", userId],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const { Principal: P } = await import("@icp-sdk/core/principal");
      return actor.adminGetUserReferralChain(P.fromText(userId));
    },
    enabled: !!actor && !isFetching,
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-orange-400" />
            Referral Chain
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          {isLoading ? (
            <Skeleton className="h-20 rounded-lg bg-gray-800" />
          ) : (
            <>
              {chain?.referredBy && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Referred By:</p>
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <p className="font-semibold text-gray-200 text-sm">
                      {chain.referredBy.username}
                    </p>
                    <p className="font-mono text-xs text-gray-500">
                      {chain.referredBy.principal.toText().slice(0, 24)}…
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Users Referred ({chain?.referred.length ?? 0}):
                </p>
                {(chain?.referred ?? []).length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No referrals made
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(chain?.referred ?? []).map((u) => (
                      <div
                        key={u.principal.toText()}
                        className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-orange-400">
                            {u.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-200 text-sm">
                            {u.username}
                          </p>
                          <p className="font-mono text-xs text-gray-500 truncate">
                            {u.principal.toText().slice(0, 20)}…
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReferralsTab() {
  const { actor, isFetching } = useActor(createActor);
  const [search, setSearch] = useState("");
  const [revokeReferral, setRevokeReferral] =
    useState<ReferralRelationshipPublic | null>(null);
  const [chainUserId, setChainUserId] = useState<string | null>(null);
  const [suspiciousIds, setSuspiciousIds] = useState<Set<string>>(new Set());

  const { data: referrals, isLoading } = useQuery<ReferralRelationshipPublic[]>(
    {
      queryKey: ["admin-referrals"],
      queryFn: async () => (actor ? actor.adminGetAllReferrals() : []),
      enabled: !!actor && !isFetching,
      refetchInterval: 30000,
    },
  );

  const detectMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.adminDetectSuspiciousReferralsByTime();
    },
    onSuccess: (data) => {
      const ids = new Set<string>();
      for (const r of data) {
        ids.add(`${r.referrerId.toText()}-${r.refereeId.toText()}`);
      }
      setSuspiciousIds(ids);
      toast.success(
        data.length > 0
          ? `Found ${data.length} suspicious referral${data.length > 1 ? "s" : ""}`
          : "No suspicious referrals detected",
      );
    },
    onError: () => toast.error("Detection failed"),
  });

  const all = referrals ?? [];
  const activeCount = all.filter(
    (r) => r.status === ReferralStatus.active,
  ).length;
  const flaggedCount = all.filter(
    (r) => r.status !== ReferralStatus.active,
  ).length;

  const filtered = search
    ? all.filter(
        (r) =>
          r.referrerId.toText().toLowerCase().includes(search.toLowerCase()) ||
          r.refereeId.toText().toLowerCase().includes(search.toLowerCase()),
      )
    : all;

  return (
    <div className="space-y-5" data-ocid="referrals-tab">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-100">
            {all.length.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total Referrals</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-green-400">
            {activeCount.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-400 mt-1">Active</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-red-400">
            {flaggedCount.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-400 mt-1">Flagged/Revoked</p>
        </div>
      </div>

      {/* Search + Detect */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            data-ocid="referral-search"
            placeholder="Search by principal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500"
          />
        </div>
        <Button
          data-ocid="detect-suspicious-btn"
          size="sm"
          onClick={() => detectMutation.mutate()}
          disabled={detectMutation.isPending}
          variant="outline"
          className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
        >
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          {detectMutation.isPending
            ? "Detecting…"
            : "Detect Suspicious Referrals"}
        </Button>
        {suspiciousIds.size > 0 && (
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <AlertCircle className="w-4 h-4" />
            {suspiciousIds.size} suspicious highlighted
            <button
              type="button"
              onClick={() => setSuspiciousIds(new Set())}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              {[
                "Referrer",
                "Referred User",
                "Bonus Given",
                "Date",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider text-left
                    ${["Date"].includes(h) ? "hidden md:table-cell" : ""}
                    ${["Bonus Given"].includes(h) ? "hidden sm:table-cell" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3].map((k) => (
                <tr key={k} className="border-b border-gray-800">
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-5 rounded bg-gray-800" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12"
                  data-ocid="referrals-empty"
                >
                  <GitBranch className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    {search ? "No results" : "No referrals yet"}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((ref, i) => {
                const badge = STATUS_BADGE[ref.status];
                const rowKey = `${ref.referrerId.toText()}-${ref.refereeId.toText()}`;
                const isSuspicious = suspiciousIds.has(rowKey);
                return (
                  <tr
                    key={rowKey}
                    data-ocid={`referral-row-${i}`}
                    className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                      isSuspicious ? "bg-yellow-500/5 border-yellow-500/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[120px]">
                      <span className="truncate block">
                        {ref.referrerId.toText().slice(0, 16)}…
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[120px]">
                      <span className="truncate block">
                        {ref.refereeId.toText().slice(0, 16)}…
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell font-bold text-orange-400 text-sm">
                      {Number(ref.bonusGiven).toLocaleString("en-IN")} coins
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                      {new Date(
                        Number(ref.timestamp) / 1_000_000,
                      ).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        {isSuspicious && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            ⚠ Suspicious
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button
                          data-ocid={`view-chain-${i}`}
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setChainUserId(ref.referrerId.toText())
                          }
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-7 px-2"
                        >
                          <GitBranch className="w-3 h-3 mr-0.5" />
                          Chain
                        </Button>
                        {ref.status === ReferralStatus.active && (
                          <Button
                            data-ocid={`revoke-referral-${i}`}
                            size="sm"
                            variant="destructive"
                            onClick={() => setRevokeReferral(ref)}
                            className="text-xs h-7 px-2"
                          >
                            <X className="w-3 h-3 mr-0.5" />
                            Revoke
                          </Button>
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

      {revokeReferral && (
        <RevokeModal
          referral={revokeReferral}
          onClose={() => setRevokeReferral(null)}
        />
      )}
      {chainUserId && (
        <ChainModal userId={chainUserId} onClose={() => setChainUserId(null)} />
      )}
    </div>
  );
}
